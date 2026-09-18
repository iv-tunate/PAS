
package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Env  string // development | production
	Port string

	DatabaseURL string

	JWTSecret string

	PaystackSecretKey string
	PaystackPublicKey string

	FlutterwaveSecretKey     string
	FlutterwavePublicKey     string
	FlutterwaveWebhookSecret string

	StripeSecretKey      string
	StripePublishableKey string
	StripeWebhookSecret  string

	BrevoAPIKey       string
	BrevoSenderEmail  string
	BrevoSenderName   string
	BrevoListID       string

	CloudinaryCloudName string
	CloudinaryAPIKey    string
	CloudinaryAPISecret string

	FrontendURL string
}

func Load() (*Config, error) {
	_ = godotenv.Load() 

	cfg := &Config{
		Env:  getEnv("APP_ENV", "development"),
		Port: getEnv("PORT", "8080"),

		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),

		PaystackSecretKey: os.Getenv("PAYSTACK_SECRET_KEY"),
		PaystackPublicKey: os.Getenv("PAYSTACK_PUBLIC_KEY"),

		FlutterwaveSecretKey:     os.Getenv("FLUTTERWAVE_SECRET_KEY"),
		FlutterwavePublicKey:     os.Getenv("FLUTTERWAVE_PUBLIC_KEY"),
		FlutterwaveWebhookSecret: os.Getenv("FLUTTERWAVE_WEBHOOK_SECRET_HASH"),

		StripeSecretKey:      os.Getenv("STRIPE_SECRET_KEY"),
		StripePublishableKey: os.Getenv("STRIPE_PUBLISHABLE_KEY"),
		StripeWebhookSecret:  os.Getenv("STRIPE_WEBHOOK_SECRET"),

		BrevoAPIKey:      os.Getenv("BREVO_API_KEY"),
		BrevoSenderEmail: os.Getenv("BREVO_SENDER_EMAIL"),
		BrevoSenderName:  getEnv("BREVO_SENDER_NAME", "Akintola Samuel"),
		BrevoListID:      os.Getenv("BREVO_LIST_ID"),

		CloudinaryCloudName: os.Getenv("CLOUDINARY_CLOUD_NAME"),
		CloudinaryAPIKey:    os.Getenv("CLOUDINARY_API_KEY"),
		CloudinaryAPISecret: os.Getenv("CLOUDINARY_API_SECRET"),

		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
