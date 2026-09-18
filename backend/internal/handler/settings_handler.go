package handler

import (
	"github.com/labstack/echo/v4"

	"github.com/iv-tunate/PAS/internal/service"
	"github.com/iv-tunate/PAS/pkg/response"
)

type SettingsHandler struct {
	settings *service.SettingsService
}

func NewSettingsHandler(settings *service.SettingsService) *SettingsHandler {
	return &SettingsHandler{settings: settings}
}

func (h *SettingsHandler) Get(c echo.Context) error {
	settings, err := h.settings.Get(c.Request().Context())
	if err != nil {
		return response.Internal(c, "could not load site settings")
	}
	return response.OK(c, "", settings)
}

type updateSettingsRequest struct {
	PastorName        string `json:"pastor_name"`
	PastorBio         string `json:"pastor_bio"`
	PastorPhotoURL    string `json:"pastor_photo_url"`
	CampusesCount     string `json:"campuses_count"`
	YearsLeadership   string `json:"years_leadership"`
	ContinentsReached string `json:"continents_reached"`
	BooksURL          string `json:"books_url"`
	WebsiteURL        string `json:"website_url"`
	ContactEmail      string `json:"contact_email"`
	HeroVideoURL      string `json:"hero_video_url"`
}

func (r *updateSettingsRequest) Validate() error { return nil } // every field optional

func (h *SettingsHandler) AdminUpdate(c echo.Context) error {
	var req updateSettingsRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid_request", "could not parse request body", nil)
	}

	settings, err := h.settings.Update(c.Request().Context(), service.UpdateSettingsInput{
		PastorName:        req.PastorName,
		PastorBio:         req.PastorBio,
		PastorPhotoURL:    req.PastorPhotoURL,
		CampusesCount:     req.CampusesCount,
		YearsLeadership:   req.YearsLeadership,
		ContinentsReached: req.ContinentsReached,
		BooksURL:          req.BooksURL,
		WebsiteURL:        req.WebsiteURL,
		ContactEmail:      req.ContactEmail,
		HeroVideoURL:      req.HeroVideoURL,
	})
	if err != nil {
		return response.Internal(c, "could not update site settings")
	}
	return response.OK(c, "settings updated", settings)
}
