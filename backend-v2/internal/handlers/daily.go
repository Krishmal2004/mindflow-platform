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

// Port of backend/src/controllers/dailyController.ts.
type DailyHandler struct {
	svc *services.DailyService
}

func NewDailyHandler(svc *services.DailyService) *DailyHandler {
	return &DailyHandler{svc: svc}
}

func (h *DailyHandler) GetStatus(c *gin.Context) {
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

	status, err := h.svc.GetDailyStatus(c.Request.Context(), userID)
	if err != nil {
		log.Printf("getDailyStatus: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, status)
}

// dailyEntryRequest mirrors dailyController.ts's dailyEntrySchema: all
// core metrics are 1-5 per DB CHECK constraints.
type dailyEntryRequest struct {
	StressLevel         int32   `json:"stress_level"`
	CalmBefore          int32   `json:"calm_before"`
	CalmAfter           int32   `json:"calm_after"`
	SleepQuality        int32   `json:"sleep_quality"`
	SleepStartTime      *string `json:"sleep_start_time"`
	WakeUpTime          *string `json:"wake_up_time"`
	Feelings            *string `json:"feelings"`
	MindfulnessPractice *string `json:"mindfulness_practice"`
	PracticeDuration    *int32  `json:"practice_duration"`
	PracticeLocation    *string `json:"practice_location"`
}

func validateScale1to5(path string, v int32, issues *[]validationIssue) {
	if v < 1 || v > 5 {
		*issues = append(*issues, validationIssue{Path: path, Message: path + " must be between 1 and 5"})
	}
}

func (req dailyEntryRequest) validate() []validationIssue {
	var issues []validationIssue
	validateScale1to5("stress_level", req.StressLevel, &issues)
	validateScale1to5("calm_before", req.CalmBefore, &issues)
	validateScale1to5("calm_after", req.CalmAfter, &issues)
	validateScale1to5("sleep_quality", req.SleepQuality, &issues)
	if req.Feelings != nil && len(*req.Feelings) > 2000 {
		issues = append(issues, validationIssue{Path: "feelings", Message: "feelings must be at most 2000 characters"})
	}
	if req.MindfulnessPractice != nil && *req.MindfulnessPractice != "yes" && *req.MindfulnessPractice != "no" {
		issues = append(issues, validationIssue{Path: "mindfulness_practice", Message: "must be \"yes\" or \"no\""})
	}
	if req.PracticeDuration != nil && (*req.PracticeDuration < 0 || *req.PracticeDuration > 1440) {
		issues = append(issues, validationIssue{Path: "practice_duration", Message: "must be between 0 and 1440"})
	}
	if req.PracticeLocation != nil && *req.PracticeLocation != "At University" && *req.PracticeLocation != "Outside University" {
		issues = append(issues, validationIssue{Path: "practice_location", Message: "must be \"At University\" or \"Outside University\""})
	}
	if req.MindfulnessPractice != nil && *req.MindfulnessPractice == "yes" {
		if req.PracticeDuration == nil || *req.PracticeDuration < 5 {
			issues = append(issues, validationIssue{Path: "practice_duration", Message: "practice_duration must be at least 5 when mindfulness_practice is yes"})
		}
		if req.PracticeLocation == nil || *req.PracticeLocation == "" {
			issues = append(issues, validationIssue{Path: "practice_location", Message: "practice_location is required when mindfulness_practice is yes"})
		}
	}
	return issues
}

func (h *DailyHandler) SubmitEntry(c *gin.Context) {
	user, ok := appmiddleware.AuthUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req dailyEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submission", "details": []validationIssue{{Path: "body", Message: "Malformed request body"}}})
		return
	}
	if issues := req.validate(); len(issues) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submission", "details": issues})
		return
	}

	userID, err := db.ParseUUID(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	result, err := h.svc.SubmitDailyEntry(c.Request.Context(), userID, services.DailyEntryInput{
		StressLevel:         req.StressLevel,
		CalmBefore:          req.CalmBefore,
		CalmAfter:           req.CalmAfter,
		SleepQuality:        req.SleepQuality,
		SleepStartTime:      req.SleepStartTime,
		WakeUpTime:          req.WakeUpTime,
		Feelings:            req.Feelings,
		MindfulnessPractice: req.MindfulnessPractice,
		PracticeDuration:    req.PracticeDuration,
		PracticeLocation:    req.PracticeLocation,
	})
	if err != nil {
		var already *services.AlreadySubmittedError
		if errors.As(err, &already) {
			c.JSON(http.StatusConflict, gin.H{"error": "Already submitted for today. Resets at midnight."})
			return
		}
		log.Printf("submitDailyEntry: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *DailyHandler) UpdateVideoProgress(c *gin.Context) {
	user, ok := appmiddleware.AuthUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var body struct {
		Seconds *float64 `json:"seconds"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Seconds == nil || *body.Seconds < 0 || *body.Seconds > 300 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Seconds must be a number between 0 and 300"})
		return
	}

	userID, err := db.ParseUUID(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	videoPlaySeconds, err := h.svc.UpdateVideoProgress(c.Request.Context(), userID, int32(*body.Seconds))
	if err != nil {
		log.Printf("updateVideoProgress: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "video_play_seconds": videoPlaySeconds})
}
