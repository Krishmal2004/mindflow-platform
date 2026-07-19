-- name: ListCalendarEvents :many
SELECT id, title, description, event_date, event_time, is_completed, created_at, updated_at
FROM calendar_events
WHERE event_date >= $1 AND event_date <= $2
ORDER BY event_date ASC;
