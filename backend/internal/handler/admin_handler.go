package handler

import (
	"strconv"

	"github.com/labstack/echo/v4"

	"github.com/iv-tunate/PAS/internal/service"
	"github.com/iv-tunate/PAS/pkg/response"
)

type AdminHandler struct {
	admin         *service.AdminService
	bookPurchases *service.BookPurchaseService
}

func NewAdminHandler(admin *service.AdminService, bookPurchases *service.BookPurchaseService) *AdminHandler {
	return &AdminHandler{admin: admin, bookPurchases: bookPurchases}
}

func (h *AdminHandler) DashboardStats(c echo.Context) error {
	stats, err := h.admin.DashboardStats(c.Request().Context())
	if err != nil {
		return response.Internal(c, "could not load dashboard stats")
	}
	return response.OK(c, "", stats)
}

func (h *AdminHandler) ListUsers(c echo.Context) error {
	limit, offset := pageParams(c)
	users, err := h.admin.ListUsers(c.Request().Context(), limit, offset)
	if err != nil {
		return response.Internal(c, "could not load users")
	}
	return response.OK(c, "", users)
}

func (h *AdminHandler) ListPayments(c echo.Context) error {
	limit, offset := pageParams(c)
	payments, err := h.admin.ListPayments(c.Request().Context(), limit, offset)
	if err != nil {
		return response.Internal(c, "could not load payments")
	}
	return response.OK(c, "", payments)
}

func (h *AdminHandler) ListSubscribers(c echo.Context) error {
	limit, offset := pageParams(c)
	subs, err := h.admin.ListSubscribers(c.Request().Context(), limit, offset)
	if err != nil {
		return response.Internal(c, "could not load subscribers")
	}
	return response.OK(c, "", subs)
}

func (h *AdminHandler) ListBookPurchases(c echo.Context) error {
	limit, offset := pageParams(c)
	purchases, err := h.bookPurchases.ListForAdmin(c.Request().Context(), limit, offset)
	if err != nil {
		return response.Internal(c, "could not load book purchases")
	}
	return response.OK(c, "", purchases)
}

func pageParams(c echo.Context) (limit, offset int32) {
	perPage, _ := strconv.Atoi(c.QueryParam("per_page"))
	if perPage <= 0 || perPage > 100 {
		perPage = 20
	}
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page <= 0 {
		page = 1
	}
	return int32(perPage), int32((page - 1) * perPage)
}
