package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	appmiddleware "github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/middleware"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
)

// Port of backend/src/controllers/notificationController.ts.
type NotificationHandler struct {
	svc *services.NotificationService
}

func NewNotificationHandler(svc *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

type registerTokenRequest struct {
	Token    string  `json:"token"`
	Platform *string `json:"platform"`
}

func (h *NotificationHandler) RegisterToken(c *gin.Context) {
	user, ok := appmiddleware.AuthUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req registerTokenRequest
	invalid := c.ShouldBindJSON(&req) != nil || req.Token == ""
	if !invalid && req.Platform != nil {
		p := *req.Platform
		invalid = p != "ios" && p != "android" && p != "web"
	}
	if invalid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "A valid Expo push token is required"})
		return
	}

	userID, err := db.ParseUUID(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	// Matches notificationController.ts exactly: the Expo-token-format
	// check happens inside the service, and any failure there (including
	// an invalid format) falls through to this generic 500 -- the 400
	// above only covers a missing/empty token or bad platform enum.
	if err := h.svc.RegisterToken(c.Request.Context(), userID, req.Token, req.Platform); err != nil {
		log.Printf("registerPushToken: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

type unregisterTokenRequest struct {
	Token string `json:"token"`
}

func (h *NotificationHandler) UnregisterToken(c *gin.Context) {
	user, ok := appmiddleware.AuthUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req unregisterTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token is required"})
		return
	}

	userID, err := db.ParseUUID(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	if err := h.svc.RemoveToken(c.Request.Context(), userID, req.Token); err != nil {
		log.Printf("unregisterPushToken: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
