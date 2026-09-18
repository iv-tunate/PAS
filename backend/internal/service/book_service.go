package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iv-tunate/PAS/internal/db/sqlc"
)

type BookService struct {
	queries *sqlc.Queries
}

func NewBookService(pool *pgxpool.Pool) *BookService {
	return &BookService{queries: sqlc.New(pool)}
}

func (s *BookService) ListPublished(ctx context.Context) ([]sqlc.Book, error) {
	return s.queries.ListPublishedBooks(ctx)
}

func (s *BookService) ListAllForAdmin(ctx context.Context) ([]sqlc.Book, error) {
	return s.queries.ListAllBooks(ctx)
}

func (s *BookService) GetByID(ctx context.Context, id uuid.UUID) (sqlc.Book, error) {
	return s.queries.GetBookByID(ctx, id)
}

type CreateBookInput struct {
	Title         string
	Author        string
	Description   string
	CoverImageURL string
	FileURL       string
	PriceKobo     int64
	PriceUSDCents int64
	IsPublished   bool
}

func (s *BookService) Create(ctx context.Context, in CreateBookInput) (sqlc.Book, error) {
	return s.queries.CreateBook(ctx, sqlc.CreateBookParams{
		Title:         in.Title,
		Author:        in.Author,
		Description:   in.Description,
		CoverImageUrl: in.CoverImageURL,
		FileUrl:       in.FileURL,
		PriceKobo:     in.PriceKobo,
		PriceUsdCents: in.PriceUSDCents,
		IsPublished:   in.IsPublished,
	})
}

func (s *BookService) Update(ctx context.Context, id uuid.UUID, in CreateBookInput) (sqlc.Book, error) {
	return s.queries.UpdateBook(ctx, sqlc.UpdateBookParams{
		ID:            id,
		Title:         in.Title,
		Author:        in.Author,
		Description:   in.Description,
		CoverImageUrl: in.CoverImageURL,
		FileUrl:       in.FileURL,
		PriceKobo:     in.PriceKobo,
		PriceUsdCents: in.PriceUSDCents,
		IsPublished:   in.IsPublished,
	})
}

func (s *BookService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.queries.DeleteBook(ctx, id)
}
