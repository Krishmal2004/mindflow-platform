package services

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db/queries"
)

// Port of backend/src/services/profileService.ts.
type ProfileService struct {
	q queries.Querier
}

func NewProfileService(q queries.Querier) *ProfileService {
	return &ProfileService{q: q}
}

type Profile struct {
	Username   *string `json:"username"`
	ResearchID *string `json:"research_id"`
}

// GetProfile fetches username + research ID. A missing row (PGRST116 in
// Supabase terms, pgx.ErrNoRows here) is not an error -- both fields come
// back nil, same as profileService.ts.
func (s *ProfileService) GetProfile(ctx context.Context, userID pgtype.UUID) (Profile, error) {
	row, err := s.q.GetProfile(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Profile{}, nil
		}
		return Profile{}, err
	}
	return Profile{
		Username:   db.TextPtr(row.Username),
		ResearchID: db.TextPtr(row.ResearchID),
	}, nil
}

// AboutMe mirrors the about_me_profiles row shape returned by
// profileService.ts's getAboutMe.
type AboutMe struct {
	ID                 string  `json:"id"`
	UniversityID       *string `json:"university_id"`
	EducationLevel     *string `json:"education_level"`
	Faculty            *string `json:"faculty"`
	MajorFieldOfStudy  *string `json:"major_field_of_study"`
	Age                *int32  `json:"age"`
	LivingSituation    *string `json:"living_situation"`
	FamilyBackground   *string `json:"family_background"`
	CulturalBackground *string `json:"cultural_background"`
	HobbiesInterests   *string `json:"hobbies_interests"`
	PersonalGoals      *string `json:"personal_goals"`
	WhyMindflow        *string `json:"why_mindflow"`
	IsCompleted        bool    `json:"is_completed"`
	CreatedAt          *string `json:"created_at,omitempty"`
	UpdatedAt          *string `json:"updated_at,omitempty"`
}

// GetAboutMe returns the full all-null/is_completed:false default shape
// when no row exists, never a bare null -- the mobile onboarding gate
// (postAuthRoute.ts) depends on this exact shape (see plan §5 and
// CLAUDE.md's onboarding-gate note). In practice a row always exists
// (auto-created by the handle_new_user_about_me trigger on signup), but
// this defensive branch is ported as-is.
func (s *ProfileService) GetAboutMe(ctx context.Context, userID pgtype.UUID) (AboutMe, error) {
	row, err := s.q.GetAboutMe(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			id := userID.String()
			return AboutMe{ID: id, IsCompleted: false}, nil
		}
		return AboutMe{}, err
	}

	about := AboutMe{
		ID:                 row.ID.String(),
		UniversityID:       db.TextPtr(row.UniversityID),
		EducationLevel:     db.TextPtr(row.EducationLevel),
		Faculty:            db.TextPtr(row.Faculty),
		MajorFieldOfStudy:  db.TextPtr(row.MajorFieldOfStudy),
		LivingSituation:    db.TextPtr(row.LivingSituation),
		FamilyBackground:   db.TextPtr(row.FamilyBackground),
		CulturalBackground: db.TextPtr(row.CulturalBackground),
		HobbiesInterests:   db.TextPtr(row.HobbiesInterests),
		PersonalGoals:      db.TextPtr(row.PersonalGoals),
		WhyMindflow:        db.TextPtr(row.WhyMindflow),
		IsCompleted:        row.IsCompleted.Valid && row.IsCompleted.Bool,
	}
	if row.Age.Valid {
		about.Age = &row.Age.Int32
	}
	if row.CreatedAt.Valid {
		s := row.CreatedAt.Time.Format("2006-01-02T15:04:05.999999Z07:00")
		about.CreatedAt = &s
	}
	if row.UpdatedAt.Valid {
		s := row.UpdatedAt.Time.Format("2006-01-02T15:04:05.999999Z07:00")
		about.UpdatedAt = &s
	}
	return about, nil
}
