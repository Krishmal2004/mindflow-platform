package researchgroup

import "testing"

func TestDerive(t *testing.T) {
	str := func(s string) *string { return &s }

	cases := []struct {
		name       string
		researchID *string
		want       Group
	}{
		{"experimental suffix", str("MF-2026-001.ex"), Experimental},
		{"control suffix", str("MF-2026-001.cg"), Control},
		{"no suffix", str("MF-2026-001"), None},
		{"empty string", str(""), None},
		{"nil", nil, None},
	}

	for _, c := range cases {
		if got := Derive(c.researchID); got != c.want {
			t.Errorf("%s: Derive(%v) = %q, want %q", c.name, c.researchID, got, c.want)
		}
	}
}
