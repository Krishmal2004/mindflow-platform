package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/auth/supabaseauth"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
)

// Port of backend/src/controllers/authController.ts. These remain thin
// proxies to Supabase's Auth HTTP API (see plan §4) -- Go isn't
// reimplementing password hashing, OTP generation, or session issuance.
type AuthHandler struct {
	client *supabaseauth.Client
	svc    *services.AuthService
}

func NewAuthHandler(client *supabaseauth.Client, svc *services.AuthService) *AuthHandler {
	return &AuthHandler{client: client, svc: svc}
}

type validationIssue struct {
	Path    string `json:"path"`
	Message string `json:"message"`
}

func respondInvalid(c *gin.Context, issues []validationIssue) {
	c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input", "details": issues})
}

type signupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

func (h *AuthHandler) Signup(c *gin.Context) {
	var req signupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondInvalid(c, []validationIssue{{Path: "body", Message: "Malformed request body"}})
		return
	}

	var issues []validationIssue
	if !isValidEmail(req.Email) {
		issues = append(issues, validationIssue{Path: "email", Message: "Valid email is required"})
	}
	if len(req.Password) < 8 {
		issues = append(issues, validationIssue{Path: "password", Message: "Password must be at least 8 characters"})
	}
	if len(req.FullName) > 200 {
		issues = append(issues, validationIssue{Path: "full_name", Message: "full_name must be at most 200 characters"})
	}
	if len(issues) > 0 {
		respondInvalid(c, issues)
		return
	}

	result, err := h.client.SignUp(c.Request.Context(), req.Email, req.Password, req.FullName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": errOrDefault(err, "Signup failed")})
		return
	}

	resp := gin.H{"message": "Signup successful", "user": result.User}

	if result.User.ID() != "" {
		userID, err := db.ParseUUID(result.User.ID())
		if err == nil {
			displayName := services.DeriveDisplayName(req.Email, req.FullName)
			if warning := h.svc.UpsertSignupProfile(c.Request.Context(), userID, displayName); warning != "" {
				resp["warning"] = warning
			}
		}
	}

	c.JSON(http.StatusCreated, resp)
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondInvalid(c, []validationIssue{{Path: "body", Message: "Malformed request body"}})
		return
	}
	var issues []validationIssue
	if !isValidEmail(req.Email) {
		issues = append(issues, validationIssue{Path: "email", Message: "Valid email is required"})
	}
	if req.Password == "" {
		issues = append(issues, validationIssue{Path: "password", Message: "Password is required"})
	}
	if len(issues) > 0 {
		respondInvalid(c, issues)
		return
	}

	result, err := h.client.SignInWithPassword(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		status := http.StatusUnauthorized
		if strings.Contains(err.Error(), "Email not confirmed") {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": errOrDefault(err, "Login failed")})
		return
	}

	displayName := req.Email
	if userID, parseErr := db.ParseUUID(result.User.ID()); parseErr == nil {
		displayName = h.svc.LoginDisplayName(c.Request.Context(), userID, req.Email, metadataFullName(result.User))
	}
	if result.User != nil {
		result.User["display_name"] = displayName
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"session": result.Session,
		"user":    result.User,
	})
}

func metadataFullName(u supabaseauth.User) string {
	meta, ok := u["user_metadata"].(map[string]any)
	if !ok {
		return ""
	}
	name, _ := meta["full_name"].(string)
	return name
}

type otpRequest struct {
	Email string `json:"email"`
	Token string `json:"token"`
	Type  string `json:"type"`
}

func (h *AuthHandler) VerifyOtp(c *gin.Context) {
	var req otpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondInvalid(c, []validationIssue{{Path: "body", Message: "Malformed request body"}})
		return
	}
	var issues []validationIssue
	if !isValidEmail(req.Email) {
		issues = append(issues, validationIssue{Path: "email", Message: "Valid email is required"})
	}
	if len(req.Token) < 4 || len(req.Token) > 10 {
		issues = append(issues, validationIssue{Path: "token", Message: "token must be 4-10 characters"})
	}
	if len(issues) > 0 {
		respondInvalid(c, issues)
		return
	}
	otpType := req.Type
	if otpType == "" {
		otpType = "signup"
	}

	result, err := h.client.VerifyOTP(c.Request.Context(), req.Email, req.Token, otpType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errOrDefault(err, "Verification failed")})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verified successfully", "session": result.Session, "user": result.User})
}

type resendOtpRequest struct {
	Email string `json:"email"`
	Type  string `json:"type"`
}

func (h *AuthHandler) ResendOtp(c *gin.Context) {
	var req resendOtpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondInvalid(c, []validationIssue{{Path: "body", Message: "Malformed request body"}})
		return
	}
	if !isValidEmail(req.Email) {
		respondInvalid(c, []validationIssue{{Path: "email", Message: "Valid email is required"}})
		return
	}
	otpType := req.Type
	if otpType == "" {
		otpType = "signup"
	}

	if err := h.client.Resend(c.Request.Context(), req.Email, otpType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errOrDefault(err, "Failed to resend OTP")})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("OTP resent to %s", req.Email)})
}

type resetPasswordRequest struct {
	Email string `json:"email"`
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondInvalid(c, []validationIssue{{Path: "body", Message: "Malformed request body"}})
		return
	}
	if !isValidEmail(req.Email) {
		respondInvalid(c, []validationIssue{{Path: "email", Message: "Valid email is required"}})
		return
	}

	if err := h.client.Recover(c.Request.Context(), req.Email); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errOrDefault(err, "Failed to send reset code")})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "A verification code has been sent to your email."})
}

type confirmResetRequest struct {
	Email       string `json:"email"`
	Token       string `json:"token"`
	NewPassword string `json:"newPassword"`
}

func (h *AuthHandler) ConfirmPasswordReset(c *gin.Context) {
	var req confirmResetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondInvalid(c, []validationIssue{{Path: "body", Message: "Malformed request body"}})
		return
	}
	var issues []validationIssue
	if !isValidEmail(req.Email) {
		issues = append(issues, validationIssue{Path: "email", Message: "Valid email is required"})
	}
	if len(req.Token) < 4 || len(req.Token) > 10 {
		issues = append(issues, validationIssue{Path: "token", Message: "token must be 4-10 characters"})
	}
	if len(req.NewPassword) < 8 {
		issues = append(issues, validationIssue{Path: "newPassword", Message: "Password must be at least 8 characters"})
	}
	if len(issues) > 0 {
		respondInvalid(c, issues)
		return
	}

	result, err := h.client.VerifyOTP(c.Request.Context(), req.Email, req.Token, "recovery")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errOrDefault(err, "Password reset failed")})
		return
	}
	if result.User == nil || result.User.ID() == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not identify user from token"})
		return
	}

	if err := h.client.AdminUpdateUserPassword(c.Request.Context(), result.User.ID(), req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errOrDefault(err, "Password reset failed")})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully."})
}

type refreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req refreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		respondInvalid(c, []validationIssue{{Path: "body", Message: "Malformed request body"}})
		return
	}
	if req.RefreshToken == "" {
		respondInvalid(c, []validationIssue{{Path: "refresh_token", Message: "refresh_token is required"}})
		return
	}

	result, err := h.client.RefreshSession(c.Request.Context(), req.RefreshToken)
	if err != nil || result.Session == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Session expired. Please log in again."})
		return
	}

	c.JSON(http.StatusOK, gin.H{"session": result.Session, "user": result.User})
}

func errOrDefault(err error, fallback string) string {
	if err == nil || err.Error() == "" {
		return fallback
	}
	return err.Error()
}
