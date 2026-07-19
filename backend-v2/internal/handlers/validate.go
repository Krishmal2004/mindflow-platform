package handlers

import "regexp"

// emailPattern is a pragmatic stand-in for Zod's .email() check -- exact
// regex parity isn't a security boundary here since Supabase's Auth API
// re-validates the email server-side regardless.
var emailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)

func isValidEmail(s string) bool {
	return emailPattern.MatchString(s)
}
