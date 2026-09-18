package service

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iv-tunate/PAS/internal/db/sqlc"
)

type AdminService struct {
	queries *sqlc.Queries
}

func NewAdminService(pool *pgxpool.Pool) *AdminService {
	return &AdminService{queries: sqlc.New(pool)}
}

type DashboardStats struct {
	TotalUsers       int64 `json:"total_users"`
	TotalSubscribers int64 `json:"total_subscribers"`
	TotalRevenueKobo int64 `json:"total_revenue_kobo"`
}

func (s *AdminService) DashboardStats(ctx context.Context) (DashboardStats, error) {
	userCount, err := s.queries.CountUsers(ctx)
	if err != nil {
		return DashboardStats{}, err
	}
	subCount, err := s.queries.CountSubscribers(ctx)
	if err != nil {
		return DashboardStats{}, err
	}
	revenue, err := s.queries.SumSuccessfulPaymentsKobo(ctx)
	if err != nil {
		return DashboardStats{}, err
	}
	return DashboardStats{
		TotalUsers:       userCount,
		TotalSubscribers: subCount,
		TotalRevenueKobo: revenue,
	}, nil
}

func (s *AdminService) ListUsers(ctx context.Context, limit, offset int32) ([]sqlc.User, error) {
	return s.queries.ListUsers(ctx, sqlc.ListUsersParams{Limit: limit, Offset: offset})
}

func (s *AdminService) ListPayments(ctx context.Context, limit, offset int32) ([]sqlc.Payment, error) {
	return s.queries.ListPayments(ctx, sqlc.ListPaymentsParams{Limit: limit, Offset: offset})
}

func (s *AdminService) ListSubscribers(ctx context.Context, limit, offset int32) ([]sqlc.Subscriber, error) {
	return s.queries.ListSubscribers(ctx, sqlc.ListSubscribersParams{Limit: limit, Offset: offset})
}
