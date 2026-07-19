package timeutil

import (
	"testing"
	"time"
)

// Golden values captured by running backend/src/utils/date.ts under
// ts-node directly, not re-derived from the ISO 8601 spec — see
// plans/backend-go-migration.md §5 ("compare against known outputs from
// the TS version at boundary dates").
func TestGetISOWeekNumber(t *testing.T) {
	cases := []struct {
		instant  string
		wantYear int
		wantWeek int
	}{
		{"2004-12-31T12:00:00Z", 2004, 53},
		{"2005-01-01T12:00:00Z", 2004, 53},
		{"2005-01-02T12:00:00Z", 2004, 53},
		{"2005-01-03T12:00:00Z", 2005, 1},
		{"2006-01-01T12:00:00Z", 2005, 52},
		{"2007-12-31T12:00:00Z", 2008, 1},
		{"2008-12-29T12:00:00Z", 2009, 1},
		{"2010-01-03T12:00:00Z", 2009, 53},
		{"2010-01-04T12:00:00Z", 2010, 1},
		{"2026-07-19T12:00:00Z", 2026, 29},
		{"2026-12-31T12:00:00Z", 2026, 53},
	}

	for _, c := range cases {
		instant, err := time.Parse(time.RFC3339, c.instant)
		if err != nil {
			t.Fatalf("parsing %q: %v", c.instant, err)
		}
		gotYear, gotWeek := GetISOWeekNumber(instant)
		if gotYear != c.wantYear || gotWeek != c.wantWeek {
			t.Errorf("GetISOWeekNumber(%s) = (%d, %d), want (%d, %d)", c.instant, gotYear, gotWeek, c.wantYear, c.wantWeek)
		}
	}
}

func TestStartOfToday(t *testing.T) {
	cases := []struct {
		now  string
		want string
	}{
		{"2026-07-19T20:00:00Z", "2026-07-19T18:30:00Z"},
		{"2026-07-19T17:00:00Z", "2026-07-18T18:30:00Z"},
		{"2026-01-01T00:00:00Z", "2025-12-31T18:30:00Z"},
	}

	for _, c := range cases {
		now, err := time.Parse(time.RFC3339, c.now)
		if err != nil {
			t.Fatalf("parsing %q: %v", c.now, err)
		}
		want, err := time.Parse(time.RFC3339, c.want)
		if err != nil {
			t.Fatalf("parsing %q: %v", c.want, err)
		}
		got := startOfToday(now)
		if !got.Equal(want) {
			t.Errorf("startOfToday(%s) = %s, want %s", c.now, got.UTC().Format(time.RFC3339), c.want)
		}
	}
}

func TestStartOfNextLocalMonday(t *testing.T) {
	cases := []struct {
		now  string
		want string
	}{
		{"2026-07-19T20:00:00Z", "2026-07-26T18:30:00Z"},
		{"2026-07-19T17:00:00Z", "2026-07-19T18:30:00Z"},
		{"2026-01-01T00:00:00Z", "2026-01-04T18:30:00Z"},
	}

	for _, c := range cases {
		now, err := time.Parse(time.RFC3339, c.now)
		if err != nil {
			t.Fatalf("parsing %q: %v", c.now, err)
		}
		want, err := time.Parse(time.RFC3339, c.want)
		if err != nil {
			t.Fatalf("parsing %q: %v", c.want, err)
		}
		got := startOfNextLocalMonday(now)
		if !got.Equal(want) {
			t.Errorf("startOfNextLocalMonday(%s) = %s, want %s", c.now, got.UTC().Format(time.RFC3339), c.want)
		}
	}
}
