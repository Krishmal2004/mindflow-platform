// Package researchgroup derives a participant's study arm from their
// profile's research_id suffix. Port of
// backend/src/utils/researchGroup.ts — research group controls
// mindfulness content, not access (see CLAUDE.md).
package researchgroup

import "strings"

type Group string

const (
	Experimental Group = "ex"
	Control      Group = "cg"
	None         Group = ""
)

// Derive returns the study arm for a research_id like "MF-2026-001.ex".
func Derive(researchID *string) Group {
	if researchID == nil {
		return None
	}
	switch {
	case strings.HasSuffix(*researchID, ".ex"):
		return Experimental
	case strings.HasSuffix(*researchID, ".cg"):
		return Control
	default:
		return None
	}
}
