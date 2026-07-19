// Package notify is a minimal hand-rolled Expo push client: validate
// token format, POST to Expo's push API in chunks of 100, parse
// per-message receipts. Deliberately not a port of an unofficial/
// unmaintained community Go SDK -- see plan §1's note on this file.
package notify

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"time"
)

const (
	pushAPIURL = "https://exp.host/--/api/v2/push/send"
	chunkSize  = 100
	timeout    = 15 * time.Second
)

// expoTokenPattern matches Expo's documented push token shape:
// ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx] or the newer ExpoPushToken[...].
var expoTokenPattern = regexp.MustCompile(`^Expo(nent)?PushToken\[.+\]$`)

// IsExpoPushToken reports whether token matches Expo's push token format.
func IsExpoPushToken(token string) bool {
	return expoTokenPattern.MatchString(token)
}

type Message struct {
	To    string         `json:"to"`
	Sound string         `json:"sound,omitempty"`
	Title string         `json:"title,omitempty"`
	Body  string         `json:"body,omitempty"`
	Data  map[string]any `json:"data,omitempty"`
}

type Receipt struct {
	Status  string         `json:"status"`
	Message string         `json:"message,omitempty"`
	Details map[string]any `json:"details,omitempty"`
}

type pushResponse struct {
	Data []Receipt `json:"data"`
}

type Client struct {
	httpClient *http.Client
	pushAPIURL string
}

func NewClient() *Client {
	return &Client{httpClient: &http.Client{Timeout: timeout}, pushAPIURL: pushAPIURL}
}

// NewClientWithURL is test-only: points at a local double instead of
// Expo's real push API.
func NewClientWithURL(url string) *Client {
	return &Client{httpClient: &http.Client{Timeout: timeout}, pushAPIURL: url}
}

// SendChunked sends messages in batches of 100 (Expo's documented push
// API limit) and returns the count of receipts with status "ok". A
// chunk-send failure is logged and skipped, not fatal to the remaining
// chunks -- mirrors notificationService.ts's sendChunked.
func (c *Client) SendChunked(ctx context.Context, messages []Message) int {
	sent := 0
	for start := 0; start < len(messages); start += chunkSize {
		end := min(start+chunkSize, len(messages))
		receipts, err := c.send(ctx, messages[start:end])
		if err != nil {
			log.Printf("[notify] failed to send chunk: %v", err)
			continue
		}
		for _, r := range receipts {
			if r.Status == "ok" {
				sent++
			} else {
				log.Printf("[notify] push delivery error: %+v", r)
			}
		}
	}
	return sent
}

func (c *Client) send(ctx context.Context, messages []Message) ([]Receipt, error) {
	payload, err := json.Marshal(messages)
	if err != nil {
		return nil, fmt.Errorf("marshaling push messages: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.pushAPIURL, bytes.NewReader(payload))
	if err != nil {
		return nil, fmt.Errorf("building push request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("calling Expo push API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading push response: %w", err)
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("Expo push API returned status %d: %s", resp.StatusCode, body)
	}

	var parsed pushResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return nil, fmt.Errorf("parsing push response: %w", err)
	}
	return parsed.Data, nil
}
