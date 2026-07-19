package handlers

import "fmt"

// validateQuestions is shared by thrive/stress/mindful: each is N
// questions answered 1-5, per their respective Zod schemas.
func validateQuestions(qs []int32, issues *[]validationIssue) {
	for i, v := range qs {
		if v < 1 || v > 5 {
			path := fmt.Sprintf("q%d", i+1)
			*issues = append(*issues, validationIssue{Path: path, Message: path + " must be between 1 and 5"})
		}
	}
}
