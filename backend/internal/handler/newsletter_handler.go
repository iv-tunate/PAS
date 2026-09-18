package handler

import (
	"errors"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/iv-tunate/PAS/internal/service"
	"github.com/iv-tunate/PAS/pkg/response"
	"github.com/iv-tunate/PAS/pkg/validate"
)

type NewsletterHandler struct {
	newsletter *service.NewsletterService
}

func NewNewsletterHandler(newsletter *service.NewsletterService) *NewsletterHandler {
	return &NewsletterHandler{newsletter: newsletter}
}

type subscribeRequest struct {
	Email string `json:"email"`
}

func (r *subscribeRequest) Validate() error {
	if err := validate.Required(map[string]string{"email": r.Email}); err != nil {
		return err
	}
	if !strings.Contains(r.Email, "@") {
		return errors.New("email is not valid")
	}
	return nil
}

func (h *NewsletterHandler) Subscribe(c echo.Context) error {
	var req subscribeRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	if err := h.newsletter.Subscribe(c.Request().Context(), req.Email); err != nil {
		return response.Internal(c, "could not subscribe right now")
	}

	return response.OK(c, "subscribed", nil)
}
