package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iv-tunate/PAS/internal/db/sqlc"
)

var ErrCourseIsPaid = errors.New("this course requires payment")

type EnrollmentService struct {
	queries *sqlc.Queries
}

func NewEnrollmentService(pool *pgxpool.Pool) *EnrollmentService {
	return &EnrollmentService{queries: sqlc.New(pool)}
}

// EnrollFree enrolls a user directly, no payment involved — only valid
// for courses priced at zero. Paid courses go through the payment flow
// instead, which enrolls the user itself once Paystack confirms.
func (s *EnrollmentService) EnrollFree(ctx context.Context, userID, courseID uuid.UUID) error {
	course, err := s.queries.GetCourseByID(ctx, courseID)
	if err != nil {
		return err
	}
	if course.PriceKobo > 0 {
		return ErrCourseIsPaid
	}

	_, err = s.queries.EnrollUserInCourse(ctx, sqlc.EnrollUserInCourseParams{
		UserID:   userID,
		CourseID: courseID,
	})
	return err
}

// MyEnrolledCourseIDs returns every course ID a user has access to —
// the frontend uses this to know which "Buy" buttons should say
// "Continue" instead.
func (s *EnrollmentService) MyEnrolledCourseIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	return s.queries.ListUserEnrollments(ctx, userID)
}
