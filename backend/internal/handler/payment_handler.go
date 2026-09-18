package handler

import (
	"io"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/iv-tunate/PAS/internal/middleware"
	"github.com/iv-tunate/PAS/internal/service"
	"github.com/iv-tunate/PAS/pkg/response"
	"github.com/iv-tunate/PAS/pkg/validate"
)

type PaymentHandler struct {
	payments *service.PaymentService
	courses  *service.CourseService
	auth     *service.AuthService
}

func NewPaymentHandler(payments *service.PaymentService, courses *service.CourseService, auth *service.AuthService) *PaymentHandler {
	return &PaymentHandler{payments: payments, courses: courses, auth: auth}
}

type initPaymentRequest struct {
	CourseID string `json:"course_id"`
}

func (r *initPaymentRequest) Validate() error {
	return validate.Required(map[string]string{"course_id": r.CourseID})
}

func (h *PaymentHandler) Initialize(c echo.Context) error {
	var req initPaymentRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	courseID, err := uuid.Parse(req.CourseID)
	if err != nil {
		return response.BadRequest(c, "invalid_id", "invalid course id", nil)
	}

	ctx := c.Request().Context()
	claims := middleware.Claims(c)

	course, err := h.courses.GetByID(ctx, courseID)
	if err != nil {
		return response.NotFound(c, "course not found")
	}

	user, err := h.auth.GetByID(ctx, claims.UserID)
	if err != nil {
		return response.Unauthorized(c, "could not identify user")
	}

	checkoutURL, err := h.payments.InitializeCoursePayment(ctx, claims.UserID, courseID, user.Email, course.PriceKobo)
	if err != nil {
		return response.Internal(c, "could not start checkout")
	}

	return response.OK(c, "checkout initialized", echo.Map{"authorization_url": checkoutURL})
}

func (h *PaymentHandler) Webhook(c echo.Context) error {
	raw, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return response.BadRequest(c, "invalid_body", "could not read request body", nil)
	}

	signature := c.Request().Header.Get("x-paystack-signature")
	if !h.payments.VerifyWebhookSignature(raw, signature) {
		return response.Unauthorized(c, "invalid webhook signature")
	}

	var event struct {
		Event string `json:"event"`
		Data  struct {
			Reference string `json:"reference"`
		} `json:"data"`
	}
	if err := c.Echo().JSONSerializer.Deserialize(c, &event); err != nil {
		return response.BadRequest(c, "invalid_body", "malformed webhook payload", nil)
	}

	if event.Data.Reference != "" {
		if _, err := h.payments.ConfirmPayment(c.Request().Context(), event.Data.Reference); err != nil {
			return response.Internal(c, "could not confirm payment")
		}
	}

	return response.OK(c, "received", nil)
}

func (h *PaymentHandler) Verify(c echo.Context) error {
	reference := c.Param("reference")
	payment, err := h.payments.ConfirmPayment(c.Request().Context(), reference)
	if err != nil {
		return response.Internal(c, "could not verify payment")
	}
	return response.OK(c, "", echo.Map{"status": payment.Status})
}
