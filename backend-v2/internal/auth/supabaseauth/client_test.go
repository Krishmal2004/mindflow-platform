package supabaseauth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func testServer(t *testing.T, handler http.HandlerFunc) (*Client, *httptest.Server) {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)
	return NewClient(srv.URL, "anon-key", "service-role-key"), srv
}

func TestSignUp_PendingConfirmation(t *testing.T) {
	// GoTrue returns the bare user object (no session) when email
	// confirmation is required and hasn't happened yet.
	client, _ := testServer(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/auth/v1/signup" {
			t.Errorf("path = %s, want /auth/v1/signup", r.URL.Path)
		}
		if got := r.Header.Get("apikey"); got != "anon-key" {
			t.Errorf("apikey header = %q, want anon-key", got)
		}
		var body map[string]any
		json.NewDecoder(r.Body).Decode(&body)
		if body["email"] != "new@example.com" {
			t.Errorf("email = %v, want new@example.com", body["email"])
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"id":    "user-1",
			"email": "new@example.com",
		})
	})

	result, err := client.SignUp(context.Background(), "new@example.com", "password123", "Test User")
	if err != nil {
		t.Fatalf("SignUp() error = %v", err)
	}
	if result.User.ID() != "user-1" {
		t.Errorf("User.ID() = %q, want user-1", result.User.ID())
	}
	if result.Session != nil {
		t.Errorf("Session = %v, want nil (pending confirmation)", result.Session)
	}
}

func TestSignUp_AlreadyRegistered(t *testing.T) {
	client, _ := testServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnprocessableEntity)
		json.NewEncoder(w).Encode(map[string]any{
			"error_code": "user_already_exists",
			"msg":        "User already registered",
		})
	})

	_, err := client.SignUp(context.Background(), "dup@example.com", "password123", "")
	if err == nil {
		t.Fatal("SignUp() error = nil, want an error")
	}
	apiErr, ok := err.(*APIError)
	if !ok {
		t.Fatalf("error type = %T, want *APIError", err)
	}
	if apiErr.Message != "User already registered" {
		t.Errorf("Message = %q, want %q", apiErr.Message, "User already registered")
	}
}

func TestSignInWithPassword_Success(t *testing.T) {
	client, _ := testServer(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.RawQuery != "grant_type=password" {
			t.Errorf("query = %s, want grant_type=password", r.URL.RawQuery)
		}
		json.NewEncoder(w).Encode(map[string]any{
			"access_token":  "at-123",
			"refresh_token": "rt-123",
			"token_type":    "bearer",
			"user": map[string]any{
				"id":    "user-1",
				"email": "p@example.com",
			},
		})
	})

	result, err := client.SignInWithPassword(context.Background(), "p@example.com", "password123")
	if err != nil {
		t.Fatalf("SignInWithPassword() error = %v", err)
	}
	if result.Session["access_token"] != "at-123" {
		t.Errorf("Session[access_token] = %v, want at-123", result.Session["access_token"])
	}
	if result.User.Email() != "p@example.com" {
		t.Errorf("User.Email() = %q, want p@example.com", result.User.Email())
	}
}

func TestSignInWithPassword_EmailNotConfirmed(t *testing.T) {
	client, _ := testServer(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]any{
			"error_code": "email_not_confirmed",
			"msg":        "Email not confirmed",
		})
	})

	_, err := client.SignInWithPassword(context.Background(), "unconfirmed@example.com", "password123")
	apiErr, ok := err.(*APIError)
	if !ok {
		t.Fatalf("error type = %T, want *APIError", err)
	}
	// authController.ts's login handler special-cases this exact substring
	// to return 403 instead of 401 -- see handlers/auth.go.
	if apiErr.Message != "Email not confirmed" {
		t.Errorf("Message = %q, want %q", apiErr.Message, "Email not confirmed")
	}
}

func TestRecover_EmptyBodySuccess(t *testing.T) {
	client, _ := testServer(t, func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/auth/v1/recover" {
			t.Errorf("path = %s, want /auth/v1/recover", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{}`))
	})

	if err := client.Recover(context.Background(), "p@example.com"); err != nil {
		t.Fatalf("Recover() error = %v", err)
	}
}

func TestAdminUpdateUserPassword_UsesServiceRoleKey(t *testing.T) {
	client, _ := testServer(t, func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPut {
			t.Errorf("method = %s, want PUT", r.Method)
		}
		if r.URL.Path != "/auth/v1/admin/users/user-1" {
			t.Errorf("path = %s, want /auth/v1/admin/users/user-1", r.URL.Path)
		}
		if got := r.Header.Get("apikey"); got != "service-role-key" {
			t.Errorf("apikey header = %q, want service-role-key", got)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer service-role-key" {
			t.Errorf("Authorization header = %q, want Bearer service-role-key", got)
		}
		json.NewEncoder(w).Encode(map[string]any{"id": "user-1"})
	})

	if err := client.AdminUpdateUserPassword(context.Background(), "user-1", "newpassword123"); err != nil {
		t.Fatalf("AdminUpdateUserPassword() error = %v", err)
	}
}

func TestExtractErrorMessage_PriorityOrder(t *testing.T) {
	cases := []struct {
		name string
		body string
		want string
	}{
		{"msg wins over error_description", `{"msg":"from msg","error_description":"from desc"}`, "from msg"},
		{"error_description wins over error", `{"error_description":"from desc","error":"from err"}`, "from desc"},
		{"error used when nothing else present", `{"error":"invalid_grant"}`, "invalid_grant"},
		{"falls back to status code when unparseable", `not json`, "Supabase Auth API returned status 400"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := extractErrorMessage([]byte(c.body), 400)
			if got != c.want {
				t.Errorf("extractErrorMessage() = %q, want %q", got, c.want)
			}
		})
	}
}
