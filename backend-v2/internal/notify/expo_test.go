package notify

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestIsExpoPushToken(t *testing.T) {
	cases := []struct {
		token string
		want  bool
	}{
		{"ExponentPushToken[abc123]", true},
		{"ExpoPushToken[abc123]", true},
		{"not-a-token", false},
		{"", false},
		{"ExponentPushToken[]", false}, // requires at least one char inside
	}
	for _, c := range cases {
		if got := IsExpoPushToken(c.token); got != c.want {
			t.Errorf("IsExpoPushToken(%q) = %v, want %v", c.token, got, c.want)
		}
	}
}

func TestSendChunked_SplitsAtChunkSize(t *testing.T) {
	var receivedChunkSizes []int
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var msgs []Message
		json.NewDecoder(r.Body).Decode(&msgs)
		receivedChunkSizes = append(receivedChunkSizes, len(msgs))

		receipts := make([]Receipt, len(msgs))
		for i := range receipts {
			receipts[i] = Receipt{Status: "ok"}
		}
		json.NewEncoder(w).Encode(pushResponse{Data: receipts})
	}))
	defer srv.Close()

	client := NewClientWithURL(srv.URL)

	messages := make([]Message, 250)
	for i := range messages {
		messages[i] = Message{To: "ExponentPushToken[x]", Body: "hi"}
	}

	sent := client.SendChunked(context.Background(), messages)

	if sent != 250 {
		t.Errorf("sent = %d, want 250", sent)
	}
	if len(receivedChunkSizes) != 3 {
		t.Fatalf("chunk count = %d, want 3 (100+100+50)", len(receivedChunkSizes))
	}
	if receivedChunkSizes[0] != 100 || receivedChunkSizes[1] != 100 || receivedChunkSizes[2] != 50 {
		t.Errorf("chunk sizes = %v, want [100 100 50]", receivedChunkSizes)
	}
}

func TestSendChunked_PartialFailureDoesNotAbortRemainingChunks(t *testing.T) {
	callCount := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		if callCount == 1 {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		var msgs []Message
		json.NewDecoder(r.Body).Decode(&msgs)
		receipts := make([]Receipt, len(msgs))
		for i := range receipts {
			receipts[i] = Receipt{Status: "ok"}
		}
		json.NewEncoder(w).Encode(pushResponse{Data: receipts})
	}))
	defer srv.Close()

	client := NewClientWithURL(srv.URL)

	messages := make([]Message, 150) // 2 chunks: first fails, second succeeds
	for i := range messages {
		messages[i] = Message{To: "ExponentPushToken[x]", Body: "hi"}
	}

	sent := client.SendChunked(context.Background(), messages)

	if sent != 50 {
		t.Errorf("sent = %d, want 50 (only the second chunk succeeded)", sent)
	}
	if callCount != 2 {
		t.Errorf("callCount = %d, want 2 (first chunk's failure must not abort the second)", callCount)
	}
}

func TestSendChunked_CountsOnlyOkReceipts(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(pushResponse{Data: []Receipt{
			{Status: "ok"},
			{Status: "error", Message: "DeviceNotRegistered"},
			{Status: "ok"},
		}})
	}))
	defer srv.Close()

	client := NewClientWithURL(srv.URL)
	sent := client.SendChunked(context.Background(), []Message{{To: "a"}, {To: "b"}, {To: "c"}})

	if sent != 2 {
		t.Errorf("sent = %d, want 2", sent)
	}
}
