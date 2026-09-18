package handler

import (
	"github.com/labstack/echo/v4"

	custommw "github.com/iv-tunate/PAS/internal/middleware"
	"github.com/iv-tunate/PAS/internal/service"
)

type Handlers struct {
	Auth         *AuthHandler
	Course       *CourseHandler
	Payment      *PaymentHandler
	Newsletter   *NewsletterHandler
	Admin        *AdminHandler
	Settings     *SettingsHandler
	Upload       *UploadHandler
	Enrollment   *EnrollmentHandler
	Book         *BookHandler
	BookPurchase *BookPurchaseHandler
}

func RegisterRoutes(e *echo.Echo, h Handlers, authService *service.AuthService, frontendURL string) {
	api := e.Group("/api/v1")

	auth := api.Group("/auth")
	auth.POST("/signup", h.Auth.SignUp)
	auth.POST("/login", h.Auth.Login)
	auth.POST("/refresh", h.Auth.Refresh)
	auth.POST("/logout", h.Auth.Logout)
	auth.POST("/forgot-password", func(c echo.Context) error {
		return h.Auth.ForgotPassword(c, frontendURL+"/reset-password")
	})
	auth.POST("/reset-password", h.Auth.ResetPassword)

	api.GET("/courses", h.Course.List)
	api.GET("/courses/:slug", h.Course.GetBySlug)

	api.GET("/settings", h.Settings.Get)

	api.GET("/books", h.Book.List)

	api.POST("/newsletter/subscribe", h.Newsletter.Subscribe)

	api.POST("/payments/webhook", h.Payment.Webhook)

	api.POST("/books/webhook/paystack", h.BookPurchase.PaystackWebhook)
	api.POST("/books/webhook/flutterwave", h.BookPurchase.FlutterwaveWebhook)
	api.POST("/books/webhook/stripe", h.BookPurchase.StripeWebhook)

	requireAuth := custommw.RequireAuth(authService)

	me := api.Group("", requireAuth)
	me.GET("/me", h.Auth.Me)
	me.POST("/payments/initialize", h.Payment.Initialize)
	me.GET("/payments/verify/:reference", h.Payment.Verify)
	me.POST("/courses/:id/enroll-free", h.Enrollment.EnrollFree)
	me.GET("/my-enrollments", h.Enrollment.MyEnrollments)
	me.POST("/books/:id/checkout", h.BookPurchase.Checkout)
	me.GET("/books/verify/:reference", h.BookPurchase.Verify)
	me.GET("/my-books", h.BookPurchase.MyBooks)

	// --- Admin only ---
	admin := api.Group("/admin", requireAuth, custommw.RequireAdmin)
	admin.GET("/stats", h.Admin.DashboardStats)
	admin.GET("/users", h.Admin.ListUsers)
	admin.GET("/payments", h.Admin.ListPayments)
	admin.GET("/subscribers", h.Admin.ListSubscribers)
	admin.GET("/book-purchases", h.Admin.ListBookPurchases)

	admin.GET("/courses", h.Course.AdminList)
	admin.POST("/courses", h.Course.AdminCreate)
	admin.PUT("/courses/:id", h.Course.AdminUpdate)
	admin.DELETE("/courses/:id", h.Course.AdminDelete)

	admin.PUT("/settings", h.Settings.AdminUpdate)
	admin.GET("/uploads/signature", h.Upload.Sign)

	admin.GET("/books", h.Book.AdminList)
	admin.POST("/books", h.Book.AdminCreate)
	admin.PUT("/books/:id", h.Book.AdminUpdate)
	admin.DELETE("/books/:id", h.Book.AdminDelete)
}
