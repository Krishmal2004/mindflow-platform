// Package supabaseauth is a minimal hand-written net/http client against
// Supabase's Auth (GoTrue) REST API -- signup/login/OTP/refresh/reset
// remain thin proxies to Supabase's own Auth service (Go is not
// reimplementing password hashing, OTP generation, or session issuance),
// mirroring what backend/src/controllers/authController.ts does today:
// it also just calls the Supabase JS client's auth methods, themselves
// thin HTTP wrappers over this same API. See plan §4.
//
// GoTrue's response shapes are documented/stable but this package was
// written without access to a live Supabase project to verify against --
// per plan §6.4, run the parity-check script against the real project
// before cutover, particularly for the exact error-message text branches
// (e.g. login's "Email not confirmed" 403 special case).
package supabaseauth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const requestTimeout = 15 * time.Second

type Client struct {
	baseURL        string
	anonKey        string
	serviceRoleKey string
	httpClient     *http.Client
}

func NewClient(supabaseURL, anonKey, serviceRoleKey string) *Client {
	return &Client{
		baseURL:        strings.TrimSuffix(supabaseURL, "/"),
		anonKey:        anonKey,
		serviceRoleKey: serviceRoleKey,
		httpClient:     &http.Client{Timeout: requestTimeout},
	}
}

// APIError is returned for any non-2xx GoTrue response. Message is a
// best-effort extraction from whichever error-shape field GoTrue used
// (this varies by endpoint/version -- see the package doc comment).
type APIError struct {
	StatusCode int
	Message    string
}

func (e *APIError) Error() string { return e.Message }

// User and Session are intentionally untyped passthroughs (not hand-modeled
// structs): authController.ts forwards Supabase's raw user/session objects
// to clients verbatim (`res.json({ user: data.user })`), and mobile/web-app
// read fields (app_metadata, identities, etc.) this package has no reason
// to know about individually.
type User map[string]any
type Session map[string]any

type AuthResult struct {
	User    User
	Session Session // nil when the endpoint didn't return a session (e.g. signup pending email confirmation)
}

func (u User) ID() string {
	id, _ := u["id"].(string)
	return id
}

func (u User) Email() string {
	email, _ := u["email"].(string)
	return email
}

func (c *Client) SignUp(ctx context.Context, email, password, fullName string) (AuthResult, error) {
	body := map[string]any{
		"email":    email,
		"password": password,
		"data":     map[string]any{"full_name": fullName},
	}
	return c.doAuthRequest(ctx, http.MethodPost, "/auth/v1/signup", c.anonKey, body)
}

func (c *Client) SignInWithPassword(ctx context.Context, email, password string) (AuthResult, error) {
	body := map[string]any{"email": email, "password": password}
	return c.doAuthRequest(ctx, http.MethodPost, "/auth/v1/token?grant_type=password", c.anonKey, body)
}

func (c *Client) VerifyOTP(ctx context.Context, email, token, otpType string) (AuthResult, error) {
	body := map[string]any{"email": email, "token": token, "type": otpType}
	return c.doAuthRequest(ctx, http.MethodPost, "/auth/v1/verify", c.anonKey, body)
}

func (c *Client) Resend(ctx context.Context, email, otpType string) error {
	body := map[string]any{"email": email, "type": otpType}
	_, err := c.doAuthRequest(ctx, http.MethodPost, "/auth/v1/resend", c.anonKey, body)
	return err
}

func (c *Client) Recover(ctx context.Context, email string) error {
	body := map[string]any{"email": email}
	_, err := c.doAuthRequest(ctx, http.MethodPost, "/auth/v1/recover", c.anonKey, body)
	return err
}

func (c *Client) RefreshSession(ctx context.Context, refreshToken string) (AuthResult, error) {
	body := map[string]any{"refresh_token": refreshToken}
	return c.doAuthRequest(ctx, http.MethodPost, "/auth/v1/token?grant_type=refresh_token", c.anonKey, body)
}

// AdminUpdateUserPassword requires the service-role key -- used only by
// confirm-reset, after the recovery OTP has already been verified.
func (c *Client) AdminUpdateUserPassword(ctx context.Context, userID, newPassword string) error {
	body := map[string]any{"password": newPassword}
	path := "/auth/v1/admin/users/" + userID
	_, err := c.doAuthRequest(ctx, http.MethodPut, path, c.serviceRoleKey, body)
	return err
}

// doAuthRequest sends body as JSON with both the "apikey" header GoTrue's
// API gateway requires on every call and a Bearer Authorization header
// (same key for anon-scoped calls; the service-role key for admin calls),
// then normalizes the response into an AuthResult.
func (c *Client) doAuthRequest(ctx context.Context, method, path, key string, body map[string]any) (AuthResult, error) {
	payload, err := json.Marshal(body)
	if err != nil {
		return AuthResult{}, fmt.Errorf("marshaling request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bytes.NewReader(payload))
	if err != nil {
		return AuthResult{}, fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", "Bearer "+key)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return AuthResult{}, fmt.Errorf("calling Supabase Auth API: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return AuthResult{}, fmt.Errorf("reading response body: %w", err)
	}

	if resp.StatusCode >= 300 {
		return AuthResult{}, &APIError{StatusCode: resp.StatusCode, Message: extractErrorMessage(respBody, resp.StatusCode)}
	}

	return normalizeAuthResult(respBody)
}

// normalizeAuthResult handles the two response shapes GoTrue returns
// depending on endpoint/project settings: a session object
// (access_token/refresh_token/user at top level) for token-issuing
// endpoints, or a bare user object (signup with email confirmation
// required, and no auto-login session yet) for others.
func normalizeAuthResult(respBody []byte) (AuthResult, error) {
	if len(bytes.TrimSpace(respBody)) == 0 {
		return AuthResult{}, nil
	}

	var raw map[string]any
	if err := json.Unmarshal(respBody, &raw); err != nil {
		return AuthResult{}, fmt.Errorf("parsing Supabase Auth API response: %w", err)
	}

	if _, hasToken := raw["access_token"]; hasToken {
		result := AuthResult{Session: Session(raw)}
		if u, ok := raw["user"].(map[string]any); ok {
			result.User = User(u)
		}
		return result, nil
	}

	if _, hasID := raw["id"]; hasID {
		return AuthResult{User: User(raw)}, nil
	}

	// e.g. /resend and /recover return `{}` on success -- no user/session.
	return AuthResult{}, nil
}

// extractErrorMessage tries GoTrue's several documented error-body shapes
// in priority order, since it doesn't use one consistent shape across all
// endpoints/versions (msg+error_code on most endpoints, error+error_description
// on the OAuth-style /token endpoint).
func extractErrorMessage(respBody []byte, statusCode int) string {
	var raw map[string]any
	if err := json.Unmarshal(respBody, &raw); err == nil {
		for _, key := range []string{"msg", "error_description", "error", "message"} {
			if v, ok := raw[key].(string); ok && v != "" {
				return v
			}
		}
	}
	return fmt.Sprintf("Supabase Auth API returned status %d", statusCode)
}
