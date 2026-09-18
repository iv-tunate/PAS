package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iv-tunate/PAS/internal/config"
	"github.com/iv-tunate/PAS/internal/db/sqlc"
	"github.com/iv-tunate/PAS/internal/mailer"
	"github.com/iv-tunate/PAS/internal/payment"
)

var ErrUnknownGateway = errors.New("unknown payment gateway")
var ErrBookNotForSale = errors.New("this book has no price set for the chosen payment method")

func forceDownloadURL(url string) string {
	if !strings.Contains(url, "/upload/") {
		return url
	}
	if strings.Contains(url, "fl_attachment") {
		return url
	}
	return strings.Replace(url, "/upload/", "/upload/fl_attachment/", 1)
}

type BookPurchaseService struct {
	queries  *sqlc.Queries
	gateways map[string]payment.BookGateway
	cfg      *config.Config
	mailer   mailer.Mailer
	log      *slog.Logger
}

func NewBookPurchaseService(
	pool *pgxpool.Pool,
	cfg *config.Config,
	log *slog.Logger,
	m mailer.Mailer,
	paystackGateway, flutterwaveGateway, stripeGateway payment.BookGateway,
) *BookPurchaseService {
	return &BookPurchaseService{
		queries: sqlc.New(pool),
		gateways: map[string]payment.BookGateway{
			"paystack":    paystackGateway,
			"flutterwave": flutterwaveGateway,
			"stripe":      stripeGateway,
		},
		cfg:    cfg,
		mailer: m,
		log:    log,
	}
}

func (s *BookPurchaseService) InitializeCheckout(ctx context.Context, userID, bookID uuid.UUID, gatewayName string) (string, error) {
	gateway, ok := s.gateways[gatewayName]
	if !ok {
		return "", ErrUnknownGateway
	}

	book, err := s.queries.GetBookByID(ctx, bookID)
	if err != nil {
		return "", err
	}

	user, err := s.queries.GetUserByID(ctx, userID)
	if err != nil {
		return "", err
	}

	var amount int64
	var currency string
	switch gatewayName {
	case "stripe":
		amount, currency = book.PriceUsdCents, "USD"
	default:
		amount, currency = book.PriceKobo, "NGN"
	}
	if amount <= 0 {
		return "", ErrBookNotForSale
	}

	reference := fmt.Sprintf("bk_%s_%s", gatewayName, uuid.NewString())

	if _, err := s.queries.CreateBookPurchase(ctx, sqlc.CreateBookPurchaseParams{
		UserID:    userID,
		BookID:    bookID,
		Gateway:   gatewayName,
		Reference: reference,
		Amount:    amount,
		Currency:  currency,
	}); err != nil {
		return "", err
	}

	callbackURL := s.cfg.FrontendURL + "/books/callback"
	return gateway.Initialize(user.Email, amount, currency, reference, callbackURL)
}

func (s *BookPurchaseService) ConfirmPurchase(ctx context.Context, reference string) (sqlc.BookPurchase, error) {
	existing, err := s.queries.GetBookPurchaseByReference(ctx, reference)
	if err != nil {
		return sqlc.BookPurchase{}, err
	}

	gateway, ok := s.gateways[existing.Gateway]
	if !ok {
		return sqlc.BookPurchase{}, ErrUnknownGateway
	}

	status, err := gateway.Verify(reference)
	if err != nil {
		return sqlc.BookPurchase{}, err
	}

	mapped := "failed"
	if status == "success" {
		mapped = "success"
	}

	purchase, err := s.queries.MarkBookPurchaseStatus(ctx, sqlc.MarkBookPurchaseStatusParams{
		Reference: reference,
		Status:    mapped,
	})
	if err != nil {
		return sqlc.BookPurchase{}, err
	}

	if mapped == "success" {
		s.sendDownloadEmail(ctx, purchase)
	}

	return purchase, nil
}

func (s *BookPurchaseService) sendDownloadEmail(ctx context.Context, purchase sqlc.BookPurchase) {
	book, err := s.queries.GetBookByID(ctx, purchase.BookID)
	if err != nil {
		s.log.Error("could not load book for purchase email", "purchase_id", purchase.ID, "error", err)
		return
	}
	user, err := s.queries.GetUserByID(ctx, purchase.UserID)
	if err != nil {
		s.log.Error("could not load buyer for purchase email", "purchase_id", purchase.ID, "error", err)
		return
	}

	html := fmt.Sprintf(
		`<p>Hi %s,</p><p>Thank you for purchasing <strong>%s</strong>. Your download is ready:</p><p><a href="%s">Download your book</a></p><p>You can also find it anytime under "My books" on the site.</p>`,
		user.FullName, book.Title, forceDownloadURL(book.FileUrl),
	)

	if err := s.mailer.SendTransactional(user.Email, user.FullName, "Your book is ready: "+book.Title, html); err != nil {
		s.log.Error("failed to send book delivery email", "purchase_id", purchase.ID, "error", err)
	}
}

func (s *BookPurchaseService) MyBooks(ctx context.Context, userID uuid.UUID) ([]sqlc.Book, error) {
	return s.queries.ListMyPurchasedBooks(ctx, userID)
}

func (s *BookPurchaseService) ListForAdmin(ctx context.Context, limit, offset int32) ([]sqlc.BookPurchase, error) {
	return s.queries.ListBookPurchases(ctx, sqlc.ListBookPurchasesParams{Limit: limit, Offset: offset})
}

func (s *BookPurchaseService) VerifyPaystackWebhook(payload []byte, signatureHeader string) bool {
	gw, ok := s.gateways["paystack"].(interface {
		VerifyWebhookSignature(payload []byte, signatureHeader string) bool
	})
	return ok && gw.VerifyWebhookSignature(payload, signatureHeader)
}

func (s *BookPurchaseService) VerifyFlutterwaveWebhook(signatureHeader string) bool {
	gw, ok := s.gateways["flutterwave"].(interface {
		VerifyWebhookSignature(headerValue string) bool
	})
	return ok && gw.VerifyWebhookSignature(signatureHeader)
}

func (s *BookPurchaseService) VerifyStripeWebhook(payload []byte, signatureHeader string) bool {
	gw, ok := s.gateways["stripe"].(interface {
		VerifyWebhookSignature(payload []byte, signatureHeader string) bool
	})
	return ok && gw.VerifyWebhookSignature(payload, signatureHeader)
}
