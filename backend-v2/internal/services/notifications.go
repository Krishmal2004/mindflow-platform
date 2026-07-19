package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db/queries"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/notify"
)

// ErrInvalidExpoPushToken is returned when a registered token doesn't
// match Expo's push token format.
var ErrInvalidExpoPushToken = errors.New("Invalid Expo push token")

// taskLabels mirrors the labels on the mobile DashboardScreen's roadmap
// nodes so reminder text matches what the user sees in-app.
var taskLabels = map[string]string{
	"daily":   "Daily Sliders",
	"weekly":  "Weekly Whispers",
	"thrive":  "Thrive Tracker",
	"stress":  "Stress Snapshot",
	"mindful": "Mindful Mirror",
}

// Port of backend/src/services/notificationService.ts.
type NotificationService struct {
	q       queries.Querier
	expo    *notify.Client
	daily   *DailyService
	weekly  *WeeklyService
	thrive  *ThriveService
	stress  *StressService
	mindful *MindfulService
}

func NewNotificationService(q queries.Querier, expoClient *notify.Client, daily *DailyService, weekly *WeeklyService, thrive *ThriveService, stress *StressService, mindful *MindfulService) *NotificationService {
	return &NotificationService{q: q, expo: expoClient, daily: daily, weekly: weekly, thrive: thrive, stress: stress, mindful: mindful}
}

func (s *NotificationService) RegisterToken(ctx context.Context, userID pgtype.UUID, token string, platform *string) error {
	if !notify.IsExpoPushToken(token) {
		return ErrInvalidExpoPushToken
	}
	return s.q.UpsertPushToken(ctx, queries.UpsertPushTokenParams{
		UserID:        userID,
		ExpoPushToken: token,
		Platform:      db.OptionalText(platform),
	})
}

// RemoveToken is scoped to both expo_push_token AND user_id together --
// a security property (prevents unregistering another user's device via
// a leaked/guessed token), not an incidental query shape (see plan §5).
func (s *NotificationService) RemoveToken(ctx context.Context, userID pgtype.UUID, token string) error {
	return s.q.DeletePushToken(ctx, queries.DeletePushTokenParams{ExpoPushToken: token, UserID: userID})
}

// SendMorningGreetings sends the "Good morning, have you done today's
// tasks?" push to every registered device. Returns the count delivered.
func (s *NotificationService) SendMorningGreetings(ctx context.Context) (int, error) {
	tokensByUser, order, err := s.getTokensByUser(ctx)
	if err != nil {
		return 0, err
	}
	if len(tokensByUser) == 0 {
		return 0, nil
	}

	namesByUser, err := s.getNamesByUser(ctx, order)
	if err != nil {
		return 0, err
	}

	var messages []notify.Message
	for _, userID := range order {
		name := namesByUser[userID]
		if name == "" {
			name = "there"
		}
		for _, token := range tokensByUser[userID] {
			messages = append(messages, notify.Message{
				To:    token,
				Sound: "default",
				Title: "Good Morning! ☀️",
				Body:  fmt.Sprintf("Hi %s, Good Morning! Have you done today's tasks?", name),
				Data:  map[string]any{"type": "morning-greeting"},
			})
		}
	}

	return s.expo.SendChunked(ctx, messages), nil
}

// SendPendingTaskReminders sends a "hurry up" nudge naming whichever of
// the 5 roadmap tasks are still pending. One user's status lookup
// failing must not abort the loop and skip reminders for every
// remaining user that night.
func (s *NotificationService) SendPendingTaskReminders(ctx context.Context) (int, error) {
	tokensByUser, order, err := s.getTokensByUser(ctx)
	if err != nil {
		return 0, err
	}
	if len(tokensByUser) == 0 {
		return 0, nil
	}

	namesByUser, err := s.getNamesByUser(ctx, order)
	if err != nil {
		return 0, err
	}

	var messages []notify.Message
	for _, userID := range order {
		pending, err := s.getPendingTaskLabels(ctx, userID)
		if err != nil {
			continue
		}
		if len(pending) == 0 {
			continue
		}

		name := namesByUser[userID]
		if name == "" {
			name = "there"
		}
		body := fmt.Sprintf("Hi %s, you still have time to do: %s. Hurry up!", name, strings.Join(pending, ", "))

		for _, token := range tokensByUser[userID] {
			messages = append(messages, notify.Message{
				To:    token,
				Sound: "default",
				Title: "Still time today ⏰",
				Body:  body,
				Data:  map[string]any{"type": "pending-tasks", "pending": pending},
			})
		}
	}

	return s.expo.SendChunked(ctx, messages), nil
}

func (s *NotificationService) getPendingTaskLabels(ctx context.Context, userID pgtype.UUID) ([]string, error) {
	daily, err := s.daily.GetDailyStatus(ctx, userID)
	if err != nil {
		return nil, err
	}
	weekly, err := s.weekly.GetWeeklyStatus(ctx, userID)
	if err != nil {
		return nil, err
	}
	thrive, err := s.thrive.GetThriveStatus(ctx, userID)
	if err != nil {
		return nil, err
	}
	stress, err := s.stress.GetStressStatus(ctx, userID)
	if err != nil {
		return nil, err
	}
	mindful, err := s.mindful.GetMindfulStatus(ctx, userID)
	if err != nil {
		return nil, err
	}

	var pending []string
	if !daily.Completed {
		pending = append(pending, taskLabels["daily"])
	}
	if !weekly.Completed {
		pending = append(pending, taskLabels["weekly"])
	}
	if !thrive.Completed {
		pending = append(pending, taskLabels["thrive"])
	}
	if !stress.Completed {
		pending = append(pending, taskLabels["stress"])
	}
	if !mindful.Completed {
		pending = append(pending, taskLabels["mindful"])
	}
	return pending, nil
}

// getTokensByUser also returns a stable iteration order (map iteration
// order in Go is randomized, unlike JS's Map) so message ordering is
// deterministic across runs.
func (s *NotificationService) getTokensByUser(ctx context.Context) (map[pgtype.UUID][]string, []pgtype.UUID, error) {
	rows, err := s.q.ListAllPushTokens(ctx)
	if err != nil {
		return nil, nil, err
	}

	tokensByUser := make(map[pgtype.UUID][]string)
	var order []pgtype.UUID
	for _, row := range rows {
		if !notify.IsExpoPushToken(row.ExpoPushToken) {
			continue
		}
		if _, seen := tokensByUser[row.UserID]; !seen {
			order = append(order, row.UserID)
		}
		tokensByUser[row.UserID] = append(tokensByUser[row.UserID], row.ExpoPushToken)
	}
	return tokensByUser, order, nil
}

func (s *NotificationService) getNamesByUser(ctx context.Context, userIDs []pgtype.UUID) (map[pgtype.UUID]string, error) {
	if len(userIDs) == 0 {
		return map[pgtype.UUID]string{}, nil
	}

	rows, err := s.q.ListProfileUsernamesByID(ctx, userIDs)
	if err != nil {
		return nil, err
	}

	names := make(map[pgtype.UUID]string, len(rows))
	for _, row := range rows {
		name := "there"
		if row.Username.Valid && row.Username.String != "" {
			name = row.Username.String
		}
		names[row.ID] = name
	}
	return names, nil
}
