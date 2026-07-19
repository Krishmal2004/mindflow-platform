package r2

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// newTestClient points the S3 client at a local httptest server instead
// of the real Cloudflare R2 endpoint -- there's no live R2 project to
// verify against here, so this exercises the actual PutObject request
// (method, path, headers, body) against a minimal S3-compatible double
// rather than mocking this package's own Upload method.
func newTestClient(t *testing.T, handler http.HandlerFunc) *Client {
	t.Helper()
	srv := httptest.NewServer(handler)
	t.Cleanup(srv.Close)

	client, err := New(context.Background(), "test-account", "test-key", "test-secret", "test-bucket", "https://cdn.example.com",
		WithBaseEndpoint(srv.URL, true))
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	return client
}

func TestUpload_Success(t *testing.T) {
	var gotMethod, gotPath, gotContentType string
	var gotBody []byte

	client := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		gotMethod = r.Method
		gotPath = r.URL.Path
		gotContentType = r.Header.Get("Content-Type")
		gotBody, _ = io.ReadAll(r.Body)
		w.WriteHeader(http.StatusOK)
	})

	result, err := client.Upload(context.Background(), "WeeklyVoice/weekly-2026-W29-user-1.wav", strings.NewReader("fake-audio-bytes"), "audio/wav")
	if err != nil {
		t.Fatalf("Upload() error = %v", err)
	}

	if gotMethod != http.MethodPut {
		t.Errorf("method = %s, want PUT", gotMethod)
	}
	if gotPath != "/test-bucket/WeeklyVoice/weekly-2026-W29-user-1.wav" {
		t.Errorf("path = %s, want /test-bucket/WeeklyVoice/weekly-2026-W29-user-1.wav", gotPath)
	}
	if gotContentType != "audio/wav" {
		t.Errorf("Content-Type = %s, want audio/wav", gotContentType)
	}
	if string(gotBody) != "fake-audio-bytes" {
		t.Errorf("body = %q, want %q", gotBody, "fake-audio-bytes")
	}

	wantKey := "WeeklyVoice/weekly-2026-W29-user-1.wav"
	if result.FileKey != wantKey {
		t.Errorf("FileKey = %q, want %q", result.FileKey, wantKey)
	}
	wantURL := "https://cdn.example.com/" + wantKey
	if result.FileURL != wantURL {
		t.Errorf("FileURL = %q, want %q", result.FileURL, wantURL)
	}
}

func TestUpload_DefaultsContentType(t *testing.T) {
	var gotContentType string
	client := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		gotContentType = r.Header.Get("Content-Type")
		w.WriteHeader(http.StatusOK)
	})

	if _, err := client.Upload(context.Background(), "key", strings.NewReader("x"), ""); err != nil {
		t.Fatalf("Upload() error = %v", err)
	}
	if gotContentType != "audio/wav" {
		t.Errorf("Content-Type = %s, want default audio/wav", gotContentType)
	}
}

func TestUpload_ServerError(t *testing.T) {
	client := newTestClient(t, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	})

	if _, err := client.Upload(context.Background(), "key", strings.NewReader("x"), "audio/wav"); err == nil {
		t.Fatal("Upload() error = nil, want an error on 500 response")
	}
}
