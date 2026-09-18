package server

import (
	"context"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	echomw "github.com/labstack/echo/v4/middleware"

	"github.com/iv-tunate/PAS/internal/config"
	"github.com/iv-tunate/PAS/internal/handler"
	"github.com/iv-tunate/PAS/internal/mailer"
	custommw "github.com/iv-tunate/PAS/internal/middleware"
	"github.com/iv-tunate/PAS/internal/payment"
	"github.com/iv-tunate/PAS/internal/service"
	"github.com/iv-tunate/PAS/internal/upload"
)

func New(cfg *config.Config, log *slog.Logger, pool *pgxpool.Pool) *echo.Echo {
	paystack := payment.NewPaystackGateway(cfg.PaystackSecretKey)
	brevo := mailer.NewBrevoMailer(cfg.BrevoAPIKey, cfg.BrevoSenderEmail, cfg.BrevoSenderName)
	cloudinarySigner := upload.NewCloudinarySigner(cfg.CloudinaryCloudName, cfg.CloudinaryAPIKey, cfg.CloudinaryAPISecret)

	paystackBookGateway := payment.NewPaystackBookGateway(cfg.PaystackSecretKey)
	flutterwaveGateway := payment.NewFlutterwaveGateway(cfg.FlutterwaveSecretKey, cfg.FlutterwaveWebhookSecret)
	stripeGateway := payment.NewStripeGateway(cfg.StripeSecretKey, cfg.StripeWebhookSecret)

	authService := service.NewAuthService(pool, cfg, log, brevo)
	courseService := service.NewCourseService(pool, log)
	paymentService := service.NewPaymentService(pool, paystack, cfg, log)
	newsletterService := service.NewNewsletterService(pool, brevo, cfg.BrevoListID, log)
	adminService := service.NewAdminService(pool)
	settingsService := service.NewSettingsService(pool)
	enrollmentService := service.NewEnrollmentService(pool)
	bookService := service.NewBookService(pool)
	bookPurchaseService := service.NewBookPurchaseService(pool, cfg, log, brevo, paystackBookGateway, flutterwaveGateway, stripeGateway)

	handlers := handler.Handlers{
		Auth:         handler.NewAuthHandler(authService),
		Course:       handler.NewCourseHandler(courseService),
		Payment:      handler.NewPaymentHandler(paymentService, courseService, authService),
		Newsletter:   handler.NewNewsletterHandler(newsletterService),
		Admin:        handler.NewAdminHandler(adminService, bookPurchaseService),
		Settings:     handler.NewSettingsHandler(settingsService),
		Upload:       handler.NewUploadHandler(cloudinarySigner),
		Enrollment:   handler.NewEnrollmentHandler(enrollmentService),
		Book:         handler.NewBookHandler(bookService),
		BookPurchase: handler.NewBookPurchaseHandler(bookPurchaseService),
	}

	e := echo.New()
	e.HideBanner = true
	e.HTTPErrorHandler = errorHandler(log)

	e.Use(echomw.RequestID())
	e.Use(custommw.RequestLogger(log))
	e.Use(echomw.Recover())
	e.Use(echomw.SecureWithConfig(echomw.SecureConfig{
		XSSProtection:         "1; mode=block",
		ContentTypeNosniff:    "nosniff",
		XFrameOptions:         "DENY",
		HSTSMaxAge:            31536000,
		HSTSExcludeSubdomains: false,
	}))

	e.Use(echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins:     []string{cfg.FrontendURL},
		AllowMethods:     []string{echo.GET, echo.POST, echo.PUT, echo.DELETE},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAuthorization},
		AllowCredentials: true,
	}))

	e.Use(echomw.RateLimiterWithConfig(echomw.RateLimiterConfig{
		Store: echomw.NewRateLimiterMemoryStoreWithConfig(echomw.RateLimiterMemoryStoreConfig{
			Rate:      20,
			Burst:     40,
			ExpiresIn: 3 * time.Minute,
		}),
	}))

	e.Use(echomw.BodyLimit("2M"))

	handler.RegisterRoutes(e, handlers, authService, cfg.FrontendURL)

	e.GET("/health", func(c echo.Context) error {
		return c.JSON(200, echo.Map{"status": "ok"})
	})

	return e
}

func errorHandler(log *slog.Logger) echo.HTTPErrorHandler {
	return func(err error, c echo.Context) {
		if c.Response().Committed {
			return
		}

		code := 500
		message := "internal server error"

		if he, ok := err.(*echo.HTTPError); ok {
			code = he.Code
			if msg, ok := he.Message.(string); ok {
				message = msg
			}
		} else {
			log.Error("unhandled error", "error", err, "path", c.Path())
		}

		_ = c.JSON(code, echo.Map{
			"success": false,
			"error":   echo.Map{"code": "error", "message": message},
		})
	}
}

func Shutdown(ctx context.Context, pool *pgxpool.Pool) {
	pool.Close()
}
