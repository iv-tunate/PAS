package handler

import (
	"errors"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/iv-tunate/PAS/internal/middleware"
	"github.com/iv-tunate/PAS/internal/service"
	"github.com/iv-tunate/PAS/pkg/response"
)

type EnrollmentHandler struct {
	enrollments *service.EnrollmentService
}

func NewEnrollmentHandler(enrollments *service.EnrollmentService) *EnrollmentHandler {
	return &EnrollmentHandler{enrollments: enrollments}
}

func (h *EnrollmentHandler) EnrollFree(c echo.Context) error {
	courseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.BadRequest(c, "invalid_id", "invalid course id", nil)
	}

	claims := middleware.Claims(c)
	if err := h.enrollments.EnrollFree(c.Request().Context(), claims.UserID, courseID); err != nil {
		if errors.Is(err, service.ErrCourseIsPaid) {
			return response.BadRequest(c, "course_requires_payment", "this course requires payment — use /payments/initialize instead", nil)
		}
		return response.Internal(c, "could not enroll")
	}

	return response.OK(c, "enrolled", nil)
}

func (h *EnrollmentHandler) MyEnrollments(c echo.Context) error {
	claims := middleware.Claims(c)
	ids, err := h.enrollments.MyEnrolledCourseIDs(c.Request().Context(), claims.UserID)
	if err != nil {
		return response.Internal(c, "could not load enrollments")
	}
	return response.OK(c, "", ids)
}
