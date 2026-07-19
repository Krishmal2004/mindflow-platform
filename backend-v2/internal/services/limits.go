// Package services holds business logic ported one-for-one from
// backend/src/services, one file per feature domain.
package services

// Port of backend/src/constants/limits.ts.
const (
	// Max rows returned for journey history endpoints.
	JourneyDefaultLimit = 90
	JourneyMaxLimit     = 365

	// Streak calculation: only load entries within this window.
	StreakLookbackDays = 400

	// Calendar query: max inclusive range in days.
	CalendarMaxRangeDays = 366
)
