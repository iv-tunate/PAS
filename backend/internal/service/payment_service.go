package service

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iv-tunate/PAS/internal/config"
	"github.com/iv-tunate/PAS/internal/db/sqlc"
	"github.com/iv-tunate/PAS/internal/payment"
)

type PaymentService struct {
	queries *sqlc.Queries
	gateway payment.Gateway
	cfg     *config.Config
	log     *slog.Logger
}

func NewPaymentService(pool *pgxpool.Pool, gateway payment.Gateway, cfg *config.Config, log *slog.Logger) *PaymentService {
	return &PaymentService{queries: sqlc.New(pool), gateway: gateway, cfg: cfg, log: log}
}

func (s *PaymentService) InitializeCoursePayment(ctx context.Context, userID, courseID uuid.UUID, userEmail string, amountKobo int64) (string, error) {
	reference := fmt.Sprintf("crs_%s", uuid.NewString())

	_, err := s.queries.CreatePayment(ctx, sqlc.CreatePaymentParams{
		UserID:            userID,
		CourseID:          uuid.NullUUID{UUID: courseID, Valid: true},
		PaystackReference: reference,
		AmountKobo:        amountKobo,
	})
	if err != nil {
		return "", err
	}

	callbackURL := s.cfg.FrontendURL + "/payment/callback"
	url, err := s.gateway.InitializeTransaction(userEmail, amountKobo, reference, callbackURL)
	if err != nil {
		return "", err
	}

	return url, nil
}

func (s *PaymentService) ConfirmPayment(ctx context.Context, reference string) (sqlc.Payment, error) {
	status, _, err := s.gateway.VerifyTransaction(reference)
	if err != nil {
		return sqlc.Payment{}, err
	}

	mapped := "failed"
	if status == "success" {
		mapped = "success"
	}

	payment, err := s.queries.MarkPaymentStatus(ctx, sqlc.MarkPaymentStatusParams{
		PaystackReference: reference,
		Status:            mapped,
	})
	if err != nil {
		return sqlc.Payment{}, err
	}

	if mapped == "success" && payment.CourseID.Valid {
		if _, err := s.queries.EnrollUserInCourse(ctx, sqlc.EnrollUserInCourseParams{
			UserID:   payment.UserID,
			CourseID: payment.CourseID.UUID,
		}); err != nil {
			s.log.Error("payment succeeded but enrollment failed — needs manual follow-up",
				"payment_id", payment.ID, "user_id", payment.UserID, "course_id", payment.CourseID.UUID, "error", err)
		}
	}

	s.log.Info("payment confirmed", "reference", reference, "status", mapped)
	return payment, nil
}

func (s *PaymentService) VerifyWebhookSignature(payload []byte, signatureHeader string) bool {
	return s.gateway.VerifyWebhookSignature(payload, signatureHeader)
}
