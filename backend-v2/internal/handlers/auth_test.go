package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/auth/supabaseauth"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/handlers"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/testutil"
)

func init() {
	gin.SetMode(gin.TestMode)
}

// fakeGoTrue lets each test script exactly how the mocked Supabase Auth
// API should respond per path, mirroring the real GoTrue response shapes
// documented in supabaseauth/client.go.
type fakeGoTrue struct {
	handlers map[string]func(w http.ResponseWriter, r *http.Request)
}

func newFakeGoTrue(t *testing.T) (*httptest.Server, *fakeGoTrue) {
	t.Helper()
	f := &fakeGoTrue{handlers: map[string]func(w http.ResponseWriter, r *http.Request){}}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h, ok := f.handlers[r.URL.Path]
		if !ok {
			t.Fatalf("unexpected request to %s", r.URL.Path)
		}
		h(w, r)
	}))
	t.Cleanup(srv.Close)
	return srv, f
}

func jsonHandler(status int, body map[string]any) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(status)
		json.NewEncoder(w).Encode(body)
	}
}

func newAuthRouter(t *testing.T) (*gin.Engine, *fakeGoTrue, *pgxpool.Pool) {
	t.Helper()
	pool, q := testutil.NewTestDB(t)
	srv, fake := newFakeGoTrue(t)
	client := supabaseauth.NewClient(srv.URL, "anon-key", "service-role-key")
	authSvc := services.NewAuthService(q)
	authHandler := handlers.NewAuthHandler(client, authSvc)

	r := gin.New()
	r.POST("/api/auth/signup", authHandler.Signup)
	r.POST("/api/auth/login", authHandler.Login)
	r.POST("/api/auth/verify-otp", authHandler.VerifyOtp)
	r.POST("/api/auth/resend-otp", authHandler.ResendOtp)
	r.POST("/api/auth/reset-password", authHandler.ResetPassword)
	r.POST("/api/auth/confirm-reset", authHandler.ConfirmPasswordReset)
	r.POST("/api/auth/refresh", authHandler.RefreshToken)
	return r, fake, pool
}

// seedAuthUser mimics the auth.users row a real Supabase signup would have
// created (GoTrue is itself Postgres-backed by the same database) --
// necessary because the fakeGoTrue HTTP double has no real side effects,
// unlike the production Supabase Auth service it stands in for.
func seedAuthUser(t *testing.T, pool *pgxpool.Pool, userID string) {
	t.Helper()
	if _, err := pool.Exec(context.Background(), `INSERT INTO auth.users (id) VALUES ($1)`, userID); err != nil {
		t.Fatalf("seeding auth.users: %v", err)
	}
}

func postJSON(t *testing.T, r *gin.Engine, path string, body map[string]any) *httptest.ResponseRecorder {
	t.Helper()
	payload, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshaling request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestSignup_ValidationFailure(t *testing.T) {
	r, _, _ := newAuthRouter(t)
	w := postJSON(t, r, "/api/auth/signup", map[string]any{"email": "not-an-email", "password": "short"})
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400, body=%s", w.Code, w.Body.String())
	}
}

func TestSignup_Success_CreatesProfile(t *testing.T) {
	r, fake, pool := newAuthRouter(t)
	userID := "11111111-1111-1111-1111-111111111111"
	// A real Supabase signup creates the auth.users row itself (GoTrue is
	// Postgres-backed by the same database) before returning -- the fake
	// HTTP double has no such side effect, so it's seeded explicitly.
	seedAuthUser(t, pool, userID)

	fake.handlers["/auth/v1/signup"] = jsonHandler(http.StatusOK, map[string]any{
		"id": userID, "email": "new@example.com",
	})

	w := postJSON(t, r, "/api/auth/signup", map[string]any{
		"email": "new@example.com", "password": "password123", "full_name": "Jane Doe",
	})
	if w.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201, body=%s", w.Code, w.Body.String())
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshaling response: %v", err)
	}
	if _, hasWarning := resp["warning"]; hasWarning {
		t.Errorf("response has unexpected warning: %v", resp["warning"])
	}
	user, ok := resp["user"].(map[string]any)
	if !ok || user["id"] != userID {
		t.Errorf("user = %v, want id %s", resp["user"], userID)
	}

	var username string
	if err := pool.QueryRow(context.Background(), `SELECT username FROM profiles WHERE id = $1`, userID).Scan(&username); err != nil {
		t.Fatalf("querying profile: %v", err)
	}
	if username != "Jane Doe" {
		t.Errorf("profiles.username = %q, want %q", username, "Jane Doe")
	}
}

func TestSignup_UsernameCollision_RetriesWithFallback(t *testing.T) {
	// A pre-existing, different user already holds the username the new
	// signup would derive ("Collide") -- the first upsert attempt must
	// hit profiles_username_key's unique constraint and silently retry
	// with an id-suffixed fallback, succeeding with no warning surfaced.
	r, fake, pool := newAuthRouter(t)

	existingUserID := "99999999-9999-9999-9999-999999999999"
	seedAuthUser(t, pool, existingUserID)
	if _, err := pool.Exec(context.Background(), `UPDATE profiles SET username = $2 WHERE id = $1`, existingUserID, "Collide"); err != nil {
		t.Fatalf("seeding colliding username: %v", err)
	}

	newUserID := "22222222-2222-2222-2222-222222222222"
	seedAuthUser(t, pool, newUserID)
	fake.handlers["/auth/v1/signup"] = jsonHandler(http.StatusOK, map[string]any{
		"id": newUserID, "email": "collide@example.com",
	})

	w := postJSON(t, r, "/api/auth/signup", map[string]any{
		"email": "collide@example.com", "password": "password123",
	})
	if w.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201, body=%s", w.Code, w.Body.String())
	}

	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	if _, hasWarning := resp["warning"]; hasWarning {
		t.Errorf("response has unexpected warning: %v (fallback should have succeeded silently)", resp["warning"])
	}

	wantFallback := services.FallbackUsername("Collide", newUserID)
	var gotUsername string
	if err := pool.QueryRow(context.Background(), `SELECT username FROM profiles WHERE id = $1`, newUserID).Scan(&gotUsername); err != nil {
		t.Fatalf("querying profile: %v", err)
	}
	if gotUsername != wantFallback {
		t.Errorf("profiles.username = %q, want fallback %q", gotUsername, wantFallback)
	}
}

func TestSignup_SupabaseError_Returns500(t *testing.T) {
	r, fake, _ := newAuthRouter(t)
	fake.handlers["/auth/v1/signup"] = jsonHandler(http.StatusUnprocessableEntity, map[string]any{
		"msg": "User already registered",
	})

	w := postJSON(t, r, "/api/auth/signup", map[string]any{
		"email": "dup@example.com", "password": "password123",
	})
	if w.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500 (TS authController always 500s on signup error), body=%s", w.Code, w.Body.String())
	}
}

func TestLogin_EmailNotConfirmed_Returns403(t *testing.T) {
	r, fake, _ := newAuthRouter(t)
	fake.handlers["/auth/v1/token"] = jsonHandler(http.StatusBadRequest, map[string]any{
		"msg": "Email not confirmed",
	})

	w := postJSON(t, r, "/api/auth/login", map[string]any{
		"email": "unconfirmed@example.com", "password": "password123",
	})
	if w.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403, body=%s", w.Code, w.Body.String())
	}
}

func TestLogin_WrongCredentials_Returns401(t *testing.T) {
	r, fake, _ := newAuthRouter(t)
	fake.handlers["/auth/v1/token"] = jsonHandler(http.StatusBadRequest, map[string]any{
		"error": "invalid_grant", "error_description": "Invalid login credentials",
	})

	w := postJSON(t, r, "/api/auth/login", map[string]any{
		"email": "p@example.com", "password": "wrongpassword",
	})
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401, body=%s", w.Code, w.Body.String())
	}
}

func TestLogin_Success_MergesDisplayName(t *testing.T) {
	r, fake, _ := newAuthRouter(t)
	fake.handlers["/auth/v1/token"] = jsonHandler(http.StatusOK, map[string]any{
		"access_token": "at-1", "refresh_token": "rt-1",
		"user": map[string]any{
			"id": "33333333-3333-3333-3333-333333333333", "email": "p@example.com",
			"user_metadata": map[string]any{"full_name": "Priya S"},
		},
	})

	w := postJSON(t, r, "/api/auth/login", map[string]any{
		"email": "p@example.com", "password": "password123",
	})
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200, body=%s", w.Code, w.Body.String())
	}

	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	user := resp["user"].(map[string]any)
	// No profiles row exists for this user in the test DB, so
	// LoginDisplayName falls back to deriving from user_metadata.full_name.
	if user["display_name"] != "Priya S" {
		t.Errorf("display_name = %v, want %q", user["display_name"], "Priya S")
	}
}

func TestRefreshToken_MissingToken_Returns400(t *testing.T) {
	r, _, _ := newAuthRouter(t)
	w := postJSON(t, r, "/api/auth/refresh", map[string]any{})
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400, body=%s", w.Code, w.Body.String())
	}
}

func TestRefreshToken_Invalid_Returns401WithFixedMessage(t *testing.T) {
	r, fake, _ := newAuthRouter(t)
	fake.handlers["/auth/v1/token"] = jsonHandler(http.StatusBadRequest, map[string]any{
		"error": "invalid_grant", "error_description": "Invalid Refresh Token",
	})

	w := postJSON(t, r, "/api/auth/refresh", map[string]any{"refresh_token": "bad-token"})
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401, body=%s", w.Code, w.Body.String())
	}
	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["error"] != "Session expired. Please log in again." {
		t.Errorf("error = %v, want fixed message regardless of underlying error", resp["error"])
	}
}

func TestRefreshToken_Success(t *testing.T) {
	r, fake, _ := newAuthRouter(t)
	fake.handlers["/auth/v1/token"] = jsonHandler(http.StatusOK, map[string]any{
		"access_token": "at-2", "refresh_token": "rt-2",
		"user": map[string]any{"id": "44444444-4444-4444-4444-444444444444"},
	})

	w := postJSON(t, r, "/api/auth/refresh", map[string]any{"refresh_token": "good-token"})
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200, body=%s", w.Code, w.Body.String())
	}
}

func TestConfirmPasswordReset_Success(t *testing.T) {
	r, fake, _ := newAuthRouter(t)
	userID := "55555555-5555-5555-5555-555555555555"
	fake.handlers["/auth/v1/verify"] = jsonHandler(http.StatusOK, map[string]any{
		"access_token": "at-3", "refresh_token": "rt-3",
		"user": map[string]any{"id": userID},
	})
	fake.handlers["/auth/v1/admin/users/"+userID] = jsonHandler(http.StatusOK, map[string]any{"id": userID})

	w := postJSON(t, r, "/api/auth/confirm-reset", map[string]any{
		"email": "p@example.com", "token": "123456", "newPassword": "newpassword123",
	})
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200, body=%s", w.Code, w.Body.String())
	}
}

func TestConfirmPasswordReset_NoUserFromToken(t *testing.T) {
	r, fake, _ := newAuthRouter(t)
	// Verify succeeds but returns no session/user (e.g. malformed OTP flow).
	fake.handlers["/auth/v1/verify"] = jsonHandler(http.StatusOK, map[string]any{})

	w := postJSON(t, r, "/api/auth/confirm-reset", map[string]any{
		"email": "p@example.com", "token": "123456", "newPassword": "newpassword123",
	})
	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400, body=%s", w.Code, w.Body.String())
	}
	var resp map[string]any
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["error"] != "Could not identify user from token" {
		t.Errorf("error = %v, want %q", resp["error"], "Could not identify user from token")
	}
}

func TestResendOtp_And_ResetPassword_Success(t *testing.T) {
	r, fake, _ := newAuthRouter(t)
	fake.handlers["/auth/v1/resend"] = jsonHandler(http.StatusOK, map[string]any{})
	fake.handlers["/auth/v1/recover"] = jsonHandler(http.StatusOK, map[string]any{})

	w := postJSON(t, r, "/api/auth/resend-otp", map[string]any{"email": "p@example.com"})
	if w.Code != http.StatusOK {
		t.Fatalf("resend-otp status = %d, want 200, body=%s", w.Code, w.Body.String())
	}

	w = postJSON(t, r, "/api/auth/reset-password", map[string]any{"email": "p@example.com"})
	if w.Code != http.StatusOK {
		t.Fatalf("reset-password status = %d, want 200, body=%s", w.Code, w.Body.String())
	}
}
