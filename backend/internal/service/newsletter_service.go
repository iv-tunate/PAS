package service

import (
	"context"
	"log/slog"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iv-tunate/PAS/internal/db/sqlc"
	"github.com/iv-tunate/PAS/internal/mailer"
)

type NewsletterService struct {
	queries *sqlc.Queries
	mailer  mailer.Mailer
	listID  string
	log     *slog.Logger
}

func NewNewsletterService(pool *pgxpool.Pool, m mailer.Mailer, brevoListID string, log *slog.Logger) *NewsletterService {
	return &NewsletterService{queries: sqlc.New(pool), mailer: m, listID: brevoListID, log: log}
}

func (s *NewsletterService) Subscribe(ctx context.Context, email string) error {
	email = normalizeEmail(email)

	if _, err := s.queries.CreateSubscriber(ctx, email); err != nil {
		return err
	}

	listID, err := strconv.Atoi(s.listID)
	if err != nil {
		s.log.Warn("BREVO_LIST_ID not configured or invalid — skipping Brevo sync", "email", email)
		return nil
	}

	if err := s.mailer.AddContactToList(email, listID); err != nil {
		s.log.Error("brevo sync failed for subscriber", "email", email, "error", err)
		return nil
	}

	if err := s.queries.MarkSubscriberSynced(ctx, email); err != nil {
		s.log.Error("failed to mark subscriber synced", "email", email, "error", err)
	}
	return nil
}
