package handlers

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	appmiddleware "github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/middleware"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
)

// Port of backend/src/controllers/thriveController.ts (WEMWBS-14).
type ThriveHandler struct {
	svc *services.ThriveService
}

func NewThriveHandler(svc *services.ThriveService) *ThriveHandler {
	return &ThriveHandler{svc: svc}
}

func (h *ThriveHandler) GetStatus(c *gin.Context) {
	user, ok := appmiddleware.AuthUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID, err := db.ParseUUID(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	status, err := h.svc.GetThriveStatus(c.Request.Context(), userID)
	if err != nil {
		log.Printf("getThriveStatus: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, status)
}

type thriveEntryRequest struct {
	Q1  int32 `json:"q1"`
	Q2  int32 `json:"q2"`
	Q3  int32 `json:"q3"`
	Q4  int32 `json:"q4"`
	Q5  int32 `json:"q5"`
	Q6  int32 `json:"q6"`
	Q7  int32 `json:"q7"`
	Q8  int32 `json:"q8"`
	Q9  int32 `json:"q9"`
	Q10 int32 `json:"q10"`
	Q11 int32 `json:"q11"`
	Q12 int32 `json:"q12"`
	Q13 int32 `json:"q13"`
	Q14 int32 `json:"q14"`

	Duration *int32 `json:"duration"`
}

func (h *ThriveHandler) SubmitEntry(c *gin.Context) {
	user, ok := appmiddleware.AuthUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req thriveEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submission", "details": []validationIssue{{Path: "body", Message: "Malformed request body"}}})
		return
	}
	var issues []validationIssue
	validateQuestions([]int32{req.Q1, req.Q2, req.Q3, req.Q4, req.Q5, req.Q6, req.Q7, req.Q8, req.Q9, req.Q10, req.Q11, req.Q12, req.Q13, req.Q14}, &issues)
	if len(issues) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submission", "details": issues})
		return
	}

	userID, err := db.ParseUUID(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	result, err := h.svc.SubmitThriveEntry(c.Request.Context(), userID, services.ThriveAnswers{
		Q1: req.Q1, Q2: req.Q2, Q3: req.Q3, Q4: req.Q4, Q5: req.Q5, Q6: req.Q6, Q7: req.Q7,
		Q8: req.Q8, Q9: req.Q9, Q10: req.Q10, Q11: req.Q11, Q12: req.Q12, Q13: req.Q13, Q14: req.Q14,
		Duration: req.Duration,
	})
	if err != nil {
		var already *services.AlreadySubmittedError
		if errors.As(err, &already) {
			c.JSON(http.StatusConflict, gin.H{"error": "Already submitted for this period."})
			return
		}
		log.Printf("submitThriveEntry: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}
