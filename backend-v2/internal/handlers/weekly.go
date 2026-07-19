package handlers

import (
	"errors"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	appmiddleware "github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/middleware"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
)

// Port of backend/src/controllers/weeklyController.ts +
// middlewares/uploadMiddleware.ts.
type WeeklyHandler struct {
	svc *services.WeeklyService
}

func NewWeeklyHandler(svc *services.WeeklyService) *WeeklyHandler {
	return &WeeklyHandler{svc: svc}
}

func (h *WeeklyHandler) GetStatus(c *gin.Context) {
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
	status, err := h.svc.GetWeeklyStatus(c.Request.Context(), userID)
	if err != nil {
		log.Printf("getWeeklyStatus: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, status)
}

func (h *WeeklyHandler) GetVideo(c *gin.Context) {
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
	video, err := h.svc.GetWeeklyVideo(c.Request.Context(), userID)
	if err != nil {
		log.Printf("getWeeklyVideo: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(http.StatusOK, video)
}

var allowedAudioMimes = map[string]bool{
	"audio/wav": true, "audio/x-wav": true, "audio/wave": true,
	"audio/mpeg": true, "audio/mp4": true, "audio/webm": true,
	"audio/ogg": true, "application/octet-stream": true,
}

var allowedAudioExt = regexp.MustCompile(`(?i)\.(wav|mp3|m4a|webm|ogg)$`)

const maxUploadBytes = 10 * 1024 * 1024 // 10MB, matches uploadMiddleware.ts's limits.fileSize

// UploadAudio proxies a multipart audio file to R2. Gin's
// MaxMultipartMemory alone does not hard-cap total upload size the way
// multer's limits.fileSize does -- the request body is wrapped in
// http.MaxBytesReader before c.FormFile, or an oversized upload would
// still buffer to disk/memory before being rejected (see plan §2.5).
func (h *WeeklyHandler) UploadAudio(c *gin.Context) {
	user, ok := appmiddleware.AuthUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadBytes)

	fileHeader, err := c.FormFile("file")
	if err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Audio file is too large (max 10MB)."})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	mime := strings.ToLower(fileHeader.Header.Get("Content-Type"))
	name := strings.ToLower(fileHeader.Filename)
	if !allowedAudioMimes[mime] && !allowedAudioExt.MatchString(name) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only audio files (wav, mp3, m4a, webm, ogg) are allowed"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	defer file.Close()

	userID, err := db.ParseUUID(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	result, err := h.svc.UploadAudio(c.Request.Context(), userID, file, mime)
	if err != nil {
		log.Printf("uploadAudio: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"fileKey": result.FileKey, "fileUrl": result.FileURL})
}

type weeklyEntryRequest struct {
	FileURL  string `json:"file_url"`
	FileKey  string `json:"file_key"`
	Duration *int32 `json:"duration"`
}

func (h *WeeklyHandler) SubmitEntry(c *gin.Context) {
	user, ok := appmiddleware.AuthUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req weeklyEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submission", "details": []validationIssue{{Path: "body", Message: "Malformed request body"}}})
		return
	}
	var issues []validationIssue
	if _, err := url.ParseRequestURI(req.FileURL); err != nil {
		issues = append(issues, validationIssue{Path: "file_url", Message: "file_url must be a valid URL"})
	}
	if req.FileKey == "" {
		issues = append(issues, validationIssue{Path: "file_key", Message: "file_key is required"})
	}
	if len(issues) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submission", "details": issues})
		return
	}

	userID, err := db.ParseUUID(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	result, err := h.svc.SubmitWeeklyEntry(c.Request.Context(), userID, req.FileURL, req.FileKey, req.Duration)
	if err != nil {
		if errors.Is(err, services.ErrWeeklyFileKeyMismatch) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Uploaded file does not match this week's submission."})
			return
		}
		log.Printf("submitWeeklyEntry: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, result)
}
