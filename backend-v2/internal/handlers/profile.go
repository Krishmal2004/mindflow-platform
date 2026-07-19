package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	appmiddleware "github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/middleware"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
)

// Port of backend/src/controllers/profileController.ts. Only the GET
// routes are implemented here -- POST /api/profile/about-me is a write
// endpoint out of scope for the read-only phase-2 pass (see plan §2 and
// internal/db/sql/profile.sql).
type ProfileHandler struct {
	svc *services.ProfileService
}

func NewProfileHandler(svc *services.ProfileService) *ProfileHandler {
	return &ProfileHandler{svc: svc}
}

func (h *ProfileHandler) GetProfile(c *gin.Context) {
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

	profile, err := h.svc.GetProfile(c.Request.Context(), userID)
	if err != nil {
		log.Printf("getProfile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	var email *string
	if user.Email != "" {
		email = &user.Email
	}
	c.JSON(http.StatusOK, gin.H{
		"username":    profile.Username,
		"research_id": profile.ResearchID,
		"email":       email,
	})
}

func (h *ProfileHandler) GetAboutMe(c *gin.Context) {
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

	aboutMe, err := h.svc.GetAboutMe(c.Request.Context(), userID)
	if err != nil {
		log.Printf("getAboutMe: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, aboutMe)
}
