package middleware

import "github.com/gin-gonic/gin"

// AuthUser is the authenticated identity attached to the Gin context by
// RequireAuth -- same shape as today's Express req.user = {id, email}.
type AuthUser struct {
	ID    string
	Email string
}

const authUserContextKey = "authUser"

func setAuthUser(c *gin.Context, u AuthUser) {
	c.Set(authUserContextKey, u)
}

// AuthUserFromContext reads the AuthUser set by RequireAuth. Handlers
// should only call this on routes mounted behind RequireAuth.
func AuthUserFromContext(c *gin.Context) (AuthUser, bool) {
	v, ok := c.Get(authUserContextKey)
	if !ok {
		return AuthUser{}, false
	}
	u, ok := v.(AuthUser)
	return u, ok
}
