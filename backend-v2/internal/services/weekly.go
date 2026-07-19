package services

import (
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db/queries"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/r2"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/researchgroup"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/timeutil"
)

// Port of backend/src/services/weeklyService.ts.
type WeeklyService struct {
	q  queries.Querier
	r2 *r2.Client
}

func NewWeeklyService(q queries.Querier, r2Client *r2.Client) *WeeklyService {
	return &WeeklyService{q: q, r2: r2Client}
}

// ErrWeeklyFileKeyMismatch is returned when a submitted file_key doesn't
// match the key UploadAudio generated for this user/week.
var ErrWeeklyFileKeyMismatch = errors.New("WEEKLY_FILE_KEY_MISMATCH")

type WeeklyStatus struct {
	Completed bool      `json:"completed"`
	Week      int       `json:"week"`
	Year      int       `json:"year"`
	NextReset time.Time `json:"nextReset"`
}

func (s *WeeklyService) GetWeeklyStatus(ctx context.Context, userID pgtype.UUID) (WeeklyStatus, error) {
	year, week := timeutil.GetISOWeekNumber(time.Now())

	_, err := s.q.GetWeeklyRecordingForWeek(ctx, queries.GetWeeklyRecordingForWeekParams{
		UserID:     userID,
		WeekNumber: int32(week),
		Year:       int32(year),
	})
	completed := true
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			completed = false
		} else {
			return WeeklyStatus{}, err
		}
	}

	return WeeklyStatus{
		Completed: completed,
		Week:      week,
		Year:      year,
		NextReset: timeutil.StartOfNextLocalMonday(),
	}, nil
}

// weeklyVoiceKey is the deterministic R2 key scheme -- must match exactly,
// since SubmitWeeklyEntry's file_key prefix-verification check depends on
// the same format being generated here (see plan §5).
func weeklyVoiceKey(year, week int, userID string) string {
	return fmt.Sprintf("WeeklyVoice/weekly-%d-W%02d-%s.wav", year, week, userID)
}

// UploadAudio is a proxy upload: receives a stream from the multipart
// handler and uploads it to R2 under this week's deterministic key.
func (s *WeeklyService) UploadAudio(ctx context.Context, userID pgtype.UUID, body io.Reader, mimeType string) (r2.UploadResult, error) {
	year, week := timeutil.GetISOWeekNumber(time.Now())
	key := weeklyVoiceKey(year, week, userID.String())
	return s.r2.Upload(ctx, key, body, mimeType)
}

// GetWeeklyVideo fetches this week's video for the user's research group,
// falling back to a group-agnostic one.
func (s *WeeklyService) GetWeeklyVideo(ctx context.Context, userID pgtype.UUID) (*queries.WeeklyRecording, error) {
	_, week := timeutil.GetISOWeekNumber(time.Now())

	researchID, err := s.q.GetResearchID(ctx, userID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	var group researchgroup.Group
	if researchID.Valid {
		group = researchgroup.Derive(&researchID.String)
	}

	rows, err := s.q.ListWeeklyRecordingsForWeek(ctx, int32(week))
	if err != nil {
		return nil, err
	}

	var groupMatch, globalMatch *queries.WeeklyRecording
	for i := range rows {
		r := rows[i]
		if group != researchgroup.None && r.TargetGroup.Valid && r.TargetGroup.String == string(group) {
			if groupMatch == nil {
				groupMatch = &r
			}
		}
		if !r.TargetGroup.Valid && globalMatch == nil {
			globalMatch = &r
		}
	}
	if groupMatch != nil {
		return groupMatch, nil
	}
	return globalMatch, nil
}

// SubmitWeeklyEntry saves recording metadata after a successful upload.
// file_key must be the key UploadAudio generated for this user/week, or a
// participant could POST an arbitrary URL to mark the week "completed"
// without recording anything.
func (s *WeeklyService) SubmitWeeklyEntry(ctx context.Context, userID pgtype.UUID, fileURL, fileKey string, duration *int32) (queries.VoiceRecording, error) {
	year, week := timeutil.GetISOWeekNumber(time.Now())
	expectedPrefix := weeklyVoiceKey(year, week, userID.String())
	// weeklyVoiceKey always ends in ".wav"; the prefix check (matching
	// the TS source) only requires the key to START WITH this, not equal
	// it exactly, in case a client-side extension differs.
	expectedPrefix = strings.TrimSuffix(expectedPrefix, ".wav")
	if !strings.HasPrefix(fileKey, expectedPrefix) {
		return queries.VoiceRecording{}, ErrWeeklyFileKeyMismatch
	}

	return s.q.UpsertVoiceRecording(ctx, queries.UpsertVoiceRecordingParams{
		UserID:     userID,
		WeekNumber: int32(week),
		Year:       int32(year),
		FileUrl:    db.OptionalText(&fileURL),
		FileKey:    fileKey,
		Duration:   db.OptionalInt4(duration),
	})
}
