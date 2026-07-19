package handlers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	appmiddleware "github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/middleware"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
)

// Port of backend/src/controllers/journeyController.ts.
type JourneyHandler struct {
	svc *services.JourneyService
}

func NewJourneyHandler(svc *services.JourneyService) *JourneyHandler {
	return &JourneyHandler{svc: svc}
}

// GetStatus is the aggregated status for all 5 journey steps.
func (h *JourneyHandler) GetStatus(c *gin.Context) {
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

	status := h.svc.GetJourneyStatus(c.Request.Context(), userID)
	c.JSON(http.StatusOK, status)
}

// GetData returns full journey data for admin/web dashboard consumption.
func (h *JourneyHandler) GetData(c *gin.Context) {
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

	limit := services.JourneyDefaultLimit
	if raw := c.Query("limit"); raw != "" {
		if requested, err := strconv.Atoi(raw); err == nil {
			limit = min(max(requested, 1), services.JourneyMaxLimit)
		}
	}

	data, err := h.svc.GetJourneyData(c.Request.Context(), userID, int32(limit))
	if err != nil {
		log.Printf("getJourneyData: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, data)
}
