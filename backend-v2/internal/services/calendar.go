package services

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db/queries"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/researchgroup"
)

// Control-group participants must not see mindfulness-themed sessions --
// same "Mindfulness Session" title convention the mobile app highlights
// on (see CLAUDE.md's research-group note).
const mindfulnessSessionPrefix = "Mindfulness Session"

// Port of backend/src/services/calendarService.ts.
type CalendarService struct {
	q queries.Querier
}

func NewCalendarService(q queries.Querier) *CalendarService {
	return &CalendarService{q: q}
}

// CalendarEvent is a response DTO, not the raw sqlc row: pgtype.Time (the
// column type of event_time) has no MarshalJSON of its own, unlike the
// other pgtype fields on this table, so it's converted to a plain
// "HH:MM:SS" string/nil here rather than leaking pgtype.Time's internal
// struct fields into the API response.
type CalendarEvent struct {
	ID          int32   `json:"id"`
	Title       string  `json:"title"`
	Description *string `json:"description"`
	EventDate   string  `json:"event_date"`
	EventTime   *string `json:"event_time"`
	IsCompleted bool    `json:"is_completed"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

const timestampLayout = "2006-01-02T15:04:05.999999Z07:00"

func toCalendarEvent(e queries.CalendarEvent) CalendarEvent {
	return CalendarEvent{
		ID:          e.ID,
		Title:       e.Title,
		Description: db.TextPtr(e.Description),
		EventDate:   e.EventDate.Time.Format("2006-01-02"),
		EventTime:   db.FormatTime(e.EventTime),
		IsCompleted: e.IsCompleted.Valid && e.IsCompleted.Bool,
		CreatedAt:   e.CreatedAt.Time.Format(timestampLayout),
		UpdatedAt:   e.UpdatedAt.Time.Format(timestampLayout),
	}
}

func (s *CalendarService) GetCalendarEvents(ctx context.Context, userID pgtype.UUID, start, end pgtype.Date) ([]CalendarEvent, error) {
	researchID, err := s.q.GetResearchID(ctx, userID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	var group researchgroup.Group
	if researchID.Valid {
		group = researchgroup.Derive(&researchID.String)
	}

	rows, err := s.q.ListCalendarEvents(ctx, queries.ListCalendarEventsParams{EventDate: start, EventDate_2: end})
	if err != nil {
		return nil, err
	}

	events := make([]CalendarEvent, 0, len(rows))
	for _, e := range rows {
		if group == researchgroup.Control && strings.HasPrefix(e.Title, mindfulnessSessionPrefix) {
			continue
		}
		events = append(events, toCalendarEvent(e))
	}
	return events, nil
}
