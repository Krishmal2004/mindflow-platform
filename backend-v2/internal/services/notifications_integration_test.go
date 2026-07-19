package services_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/notify"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/testutil"
)

func TestRegisterToken_ValidatesFormatAndUpserts(t *testing.T) {
	pool, q := testutil.NewTestDB(t)
	ctx := context.Background()
	userID := uuid.New()
	pgUserID := pgtype.UUID{Bytes: userID, Valid: true}
	if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, userID); err != nil {
		t.Fatalf("seeding user: %v", err)
	}

	svc := services.NewNotificationService(q, notify.NewClient(),
		services.NewDailyService(q), services.NewWeeklyService(q, nil),
		services.NewThriveService(q), services.NewStressService(q), services.NewMindfulService(q))

	if err := svc.RegisterToken(ctx, pgUserID, "not-a-valid-token", nil); !errors.Is(err, services.ErrInvalidExpoPushToken) {
		t.Fatalf("RegisterToken(invalid) error = %v, want ErrInvalidExpoPushToken", err)
	}

	platform := "ios"
	if err := svc.RegisterToken(ctx, pgUserID, "ExponentPushToken[abc123]", &platform); err != nil {
		t.Fatalf("RegisterToken(valid): %v", err)
	}

	var storedPlatform string
	if err := pool.QueryRow(ctx, `SELECT platform FROM push_tokens WHERE expo_push_token = $1`, "ExponentPushToken[abc123]").Scan(&storedPlatform); err != nil {
		t.Fatalf("querying push_tokens: %v", err)
	}
	if storedPlatform != "ios" {
		t.Errorf("platform = %q, want ios", storedPlatform)
	}
}

func TestRemoveToken_ScopedToUser(t *testing.T) {
	pool, q := testutil.NewTestDB(t)
	ctx := context.Background()

	ownerID := uuid.New()
	otherID := uuid.New()
	for _, id := range []uuid.UUID{ownerID, otherID} {
		if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, id); err != nil {
			t.Fatalf("seeding user: %v", err)
		}
	}

	svc := services.NewNotificationService(q, notify.NewClient(),
		services.NewDailyService(q), services.NewWeeklyService(q, nil),
		services.NewThriveService(q), services.NewStressService(q), services.NewMindfulService(q))

	ownerPgID := pgtype.UUID{Bytes: ownerID, Valid: true}
	if err := svc.RegisterToken(ctx, ownerPgID, "ExponentPushToken[owner-token]", nil); err != nil {
		t.Fatalf("registering token: %v", err)
	}

	// A different user attempting to unregister the owner's token must
	// not delete it -- see plan §5's security note.
	otherPgID := pgtype.UUID{Bytes: otherID, Valid: true}
	if err := svc.RemoveToken(ctx, otherPgID, "ExponentPushToken[owner-token]"); err != nil {
		t.Fatalf("RemoveToken (wrong user): %v", err)
	}
	var stillExists bool
	err := pool.QueryRow(ctx, `SELECT true FROM push_tokens WHERE expo_push_token = $1`, "ExponentPushToken[owner-token]").Scan(&stillExists)
	if err != nil || !stillExists {
		t.Fatalf("token was deleted by a non-owner request (err=%v)", err)
	}

	if err := svc.RemoveToken(ctx, ownerPgID, "ExponentPushToken[owner-token]"); err != nil {
		t.Fatalf("RemoveToken (owner): %v", err)
	}
	err = pool.QueryRow(ctx, `SELECT true FROM push_tokens WHERE expo_push_token = $1`, "ExponentPushToken[owner-token]").Scan(&stillExists)
	if !errors.Is(err, pgx.ErrNoRows) {
		t.Errorf("token still exists after owner's own RemoveToken, err = %v", err)
	}
}

func TestSendPendingTaskReminders_SendsForIncompleteUsersOnly(t *testing.T) {
	pool, q := testutil.NewTestDB(t)
	ctx := context.Background()

	pendingUser := uuid.New()
	if _, err := pool.Exec(ctx, `INSERT INTO auth.users (id) VALUES ($1)`, pendingUser); err != nil {
		t.Fatalf("seeding pending user: %v", err)
	}

	var receivedBodies []string
	expoServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var msgs []notify.Message
		json.NewDecoder(r.Body).Decode(&msgs)
		for _, m := range msgs {
			receivedBodies = append(receivedBodies, m.Body)
		}
		receipts := make([]notify.Receipt, len(msgs))
		for i := range receipts {
			receipts[i] = notify.Receipt{Status: "ok"}
		}
		json.NewEncoder(w).Encode(map[string]any{"data": receipts})
	}))
	defer expoServer.Close()

	svc := services.NewNotificationService(q, notify.NewClientWithURL(expoServer.URL),
		services.NewDailyService(q), services.NewWeeklyService(q, nil),
		services.NewThriveService(q), services.NewStressService(q), services.NewMindfulService(q))

	pgUserID := pgtype.UUID{Bytes: pendingUser, Valid: true}
	if err := svc.RegisterToken(ctx, pgUserID, "ExponentPushToken[pending-user]", nil); err != nil {
		t.Fatalf("registering token: %v", err)
	}

	sent, err := svc.SendPendingTaskReminders(ctx)
	if err != nil {
		t.Fatalf("SendPendingTaskReminders: %v", err)
	}
	if sent != 1 {
		t.Fatalf("sent = %d, want 1", sent)
	}
	if len(receivedBodies) != 1 {
		t.Fatalf("received %d messages, want 1", len(receivedBodies))
	}
	// A fresh user has all 5 roadmap tasks pending.
	for _, label := range []string{"Daily Sliders", "Weekly Whispers", "Thrive Tracker", "Stress Snapshot", "Mindful Mirror"} {
		if !strings.Contains(receivedBodies[0], label) {
			t.Errorf("reminder body %q missing pending task %q", receivedBodies[0], label)
		}
	}
}
