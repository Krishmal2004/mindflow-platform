package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/db"
	appmiddleware "github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/middleware"
	"github.com/BrAINLabs-Inc/mindflow-platform/backend-v2/internal/services"
)

const dateLayout = "2006-01-02"

// Port of backend/src/controllers/calendarController.ts. Mounted at both
// GET /api/calendar/events and GET /api/roadmap/calendar/events (the
// canonical web-client path) -- see plan §2.
type CalendarHandler struct {
	svc *services.CalendarService
}

func NewCalendarHandler(svc *services.CalendarService) *CalendarHandler {
	return &CalendarHandler{svc: svc}
}

func (h *CalendarHandler) GetEvents(c *gin.Context) {
	user, ok := appmiddleware.AuthUserFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	start, end, ok := parseDateRange(c.Query("start"), c.Query("end"))
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Start and end dates are required"})
		return
	}

	userID, err := db.ParseUUID(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	events, err := h.svc.GetCalendarEvents(c.Request.Context(), userID,
		pgtype.Date{Time: start, Valid: true}, pgtype.Date{Time: end, Valid: true})
	if err != nil {
		log.Printf("getCalendarEvents: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, events)
}

// parseDateRange is a port of calendarController.ts's dateQuerySchema:
// both dates must be YYYY-MM-DD, end must not precede start, and the
// range must not exceed CalendarMaxRangeDays.
func parseDateRange(startRaw, endRaw string) (start, end time.Time, ok bool) {
	start, err := time.Parse(dateLayout, startRaw)
	if err != nil {
		return time.Time{}, time.Time{}, false
	}
	end, err = time.Parse(dateLayout, endRaw)
	if err != nil {
		return time.Time{}, time.Time{}, false
	}
	if end.Before(start) {
		return time.Time{}, time.Time{}, false
	}
	days := end.Sub(start).Hours() / 24
	if days > float64(services.CalendarMaxRangeDays) {
		return time.Time{}, time.Time{}, false
	}
	return start, end, true
}
