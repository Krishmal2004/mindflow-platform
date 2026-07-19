// Package timeutil is a port of backend/src/utils/date.ts: the study
// cohort is based in Sri Lanka, and "resets at midnight" means Sri Lanka
// Standard Time (UTC+5:30), not UTC or the server process's ambient
// timezone. Fixed (no-DST) offset, so a time.FixedZone is used directly
// rather than a named IANA zone / time.LoadLocation.
package timeutil

import "time"

// SLT is the fixed UTC+5:30 offset used throughout the roadmap features.
var SLT = time.FixedZone("SLT", (5*60+30)*60)

// GetISOWeekNumber returns the ISO 8601 (year, week) for t, grounded in
// Sri Lanka local time so the week boundary lines up with the
// participant's own calendar week regardless of server timezone.
func GetISOWeekNumber(t time.Time) (year, week int) {
	return t.In(SLT).ISOWeek()
}

// StartOfToday returns the Sri Lanka local midnight for the current
// instant, as the real UTC instant it corresponds to.
func StartOfToday() time.Time {
	return startOfToday(time.Now())
}

func startOfToday(now time.Time) time.Time {
	local := now.In(SLT)
	return time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, SLT)
}

// StartOfNextLocalMonday returns the Sri Lanka local midnight of the next
// Monday — the weekly reset boundary.
func StartOfNextLocalMonday() time.Time {
	return startOfNextLocalMonday(time.Now())
}

func startOfNextLocalMonday(now time.Time) time.Time {
	todayMidnight := startOfToday(now)
	dow := int(todayMidnight.In(SLT).Weekday()) // 0=Sun..6=Sat
	if dow == 0 {
		dow = 7
	}
	daysUntilMonday := 8 - dow // 1..7
	return todayMidnight.AddDate(0, 0, daysUntilMonday)
}
