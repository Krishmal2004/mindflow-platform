package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/handlers"
	appmiddleware "github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/middleware"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/r2"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/testutil"
)

func newWeeklyUploadRouter(t *testing.T, userID string) *gin.Engine {
	t.Helper()
	_, q := testutil.NewTestDB(t)

	s3Mock := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(s3Mock.Close)

	r2Client, err := r2.New(context.Background(), "test-account", "key", "secret", "test-bucket", "https://cdn.example.com",
		r2.WithBaseEndpoint(s3Mock.URL, true))
	if err != nil {
		t.Fatalf("r2.New: %v", err)
	}

	svc := services.NewWeeklyService(q, r2Client)
	h := handlers.NewWeeklyHandler(svc)

	r := gin.New()
	// Stand in for RequireAuth -- injects a fixed AuthUser rather than
	// verifying a real JWT, since this test is about the multipart/R2
	// pipeline, not auth.
	fakeAuth := func(c *gin.Context) {
		c.Set("authUser", appmiddleware.AuthUser{ID: userID})
		c.Next()
	}
	r.POST("/api/roadmap/weekly/upload", fakeAuth, h.UploadAudio)
	return r
}

func multipartRequest(t *testing.T, fieldName, filename, contentType string, content []byte) *http.Request {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)

	header := make(map[string][]string)
	header["Content-Disposition"] = []string{`form-data; name="` + fieldName + `"; filename="` + filename + `"`}
	if contentType != "" {
		header["Content-Type"] = []string{contentType}
	}
	part, err := w.CreatePart(header)
	if err != nil {
		t.Fatalf("creating multipart part: %v", err)
	}
	if _, err := part.Write(content); err != nil {
		t.Fatalf("writing multipart content: %v", err)
	}
	if err := w.Close(); err != nil {
		t.Fatalf("closing multipart writer: %v", err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/roadmap/weekly/upload", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	return req
}

func TestUploadAudio_RejectsDisallowedMimeType(t *testing.T) {
	r := newWeeklyUploadRouter(t, "11111111-1111-1111-1111-111111111111")

	req := multipartRequest(t, "file", "not-audio.txt", "text/plain", []byte("hello"))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400, body=%s", w.Code, w.Body.String())
	}
}

func TestUploadAudio_AllowsOctetStreamWithAudioExtension(t *testing.T) {
	// uploadMiddleware.ts's fallback: application/octet-stream is
	// allowlisted, and/or a recognized extension passes even with a
	// generic mimetype.
	r := newWeeklyUploadRouter(t, "22222222-2222-2222-2222-222222222222")

	req := multipartRequest(t, "file", "recording.wav", "application/octet-stream", []byte("fake-wav-bytes"))
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200, body=%s", w.Code, w.Body.String())
	}

	var resp map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("unmarshaling response: %v", err)
	}
	fileKey, _ := resp["fileKey"].(string)
	if fileKey == "" {
		t.Errorf("fileKey missing from response: %v", resp)
	}
	fileURL, _ := resp["fileUrl"].(string)
	if fileURL != "https://cdn.example.com/"+fileKey {
		t.Errorf("fileUrl = %q, want https://cdn.example.com/%s", fileURL, fileKey)
	}
}

func TestUploadAudio_NoFile(t *testing.T) {
	r := newWeeklyUploadRouter(t, "33333333-3333-3333-3333-333333333333")

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	w.Close()
	req := httptest.NewRequest(http.MethodPost, "/api/roadmap/weekly/upload", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400, body=%s", rec.Code, rec.Body.String())
	}
}
