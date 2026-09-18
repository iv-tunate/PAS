package handler

import (
	"io"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/iv-tunate/PAS/internal/middleware"
	"github.com/iv-tunate/PAS/internal/payment"
	"github.com/iv-tunate/PAS/internal/service"
	"github.com/iv-tunate/PAS/pkg/response"
	"github.com/iv-tunate/PAS/pkg/validate"
)

type BookPurchaseHandler struct {
	purchases *service.BookPurchaseService
}

func NewBookPurchaseHandler(purchases *service.BookPurchaseService) *BookPurchaseHandler {
	return &BookPurchaseHandler{purchases: purchases}
}

type checkoutRequest struct {
	Gateway string `json:"gateway"`
}

func (r *checkoutRequest) Validate() error {
	return validate.Required(map[string]string{"gateway": r.Gateway})
}

func (h *BookPurchaseHandler) Checkout(c echo.Context) error {
	bookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.BadRequest(c, "invalid_id", "invalid book id", nil)
	}

	var req checkoutRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	claims := middleware.Claims(c)
	url, err := h.purchases.InitializeCheckout(c.Request().Context(), claims.UserID, bookID, req.Gateway)
	if err != nil {
		switch err {
		case service.ErrUnknownGateway:
			return response.BadRequest(c, "unknown_gateway", "gateway must be one of: paystack, flutterwave, stripe", nil)
		case service.ErrBookNotForSale:
			return response.BadRequest(c, "no_price_set", "this book isn't priced for that payment method yet", nil)
		default:
			return response.Internal(c, "could not start checkout")
		}
	}

	return response.OK(c, "checkout initialized", echo.Map{"checkout_url": url})
}

func (h *BookPurchaseHandler) Verify(c echo.Context) error {
	reference := c.Param("reference")
	purchase, err := h.purchases.ConfirmPurchase(c.Request().Context(), reference)
	if err != nil {
		return response.Internal(c, "could not verify purchase")
	}
	return response.OK(c, "", echo.Map{"status": purchase.Status})
}

func (h *BookPurchaseHandler) MyBooks(c echo.Context) error {
	claims := middleware.Claims(c)
	books, err := h.purchases.MyBooks(c.Request().Context(), claims.UserID)
	if err != nil {
		return response.Internal(c, "could not load your books")
	}
	return response.OK(c, "", books)
}

func (h *BookPurchaseHandler) PaystackWebhook(c echo.Context) error {
	raw, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return response.BadRequest(c, "invalid_body", "could not read request body", nil)
	}
	if !h.purchases.VerifyPaystackWebhook(raw, c.Request().Header.Get("x-paystack-signature")) {
		return response.Unauthorized(c, "invalid webhook signature")
	}

	var event struct {
		Data struct {
			Reference string `json:"reference"`
		} `json:"data"`
	}
	if err := c.Echo().JSONSerializer.Deserialize(c, &event); err != nil {
		return response.BadRequest(c, "invalid_body", "malformed webhook payload", nil)
	}
	if event.Data.Reference != "" {
		_, _ = h.purchases.ConfirmPurchase(c.Request().Context(), event.Data.Reference)
	}
	return response.OK(c, "received", nil)
}

func (h *BookPurchaseHandler) FlutterwaveWebhook(c echo.Context) error {
	if !h.purchases.VerifyFlutterwaveWebhook(c.Request().Header.Get("verif-hash")) {
		return response.Unauthorized(c, "invalid webhook signature")
	}

	var event struct {
		Data struct {
			TxRef string `json:"tx_ref"`
		} `json:"data"`
	}
	if err := c.Echo().JSONSerializer.Deserialize(c, &event); err != nil {
		return response.BadRequest(c, "invalid_body", "malformed webhook payload", nil)
	}
	if event.Data.TxRef != "" {
		_, _ = h.purchases.ConfirmPurchase(c.Request().Context(), event.Data.TxRef)
	}
	return response.OK(c, "received", nil)
}

func (h *BookPurchaseHandler) StripeWebhook(c echo.Context) error {
	raw, err := io.ReadAll(c.Request().Body)
	if err != nil {
		return response.BadRequest(c, "invalid_body", "could not read request body", nil)
	}
	if !h.purchases.VerifyStripeWebhook(raw, c.Request().Header.Get("Stripe-Signature")) {
		return response.Unauthorized(c, "invalid webhook signature")
	}

	reference := payment.ExtractReference(raw)
	if reference != "" {
		_, _ = h.purchases.ConfirmPurchase(c.Request().Context(), reference)
	}
	return response.OK(c, "received", nil)
}
