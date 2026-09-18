package handler

import (
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v4"

	"github.com/iv-tunate/PAS/internal/service"
	"github.com/iv-tunate/PAS/pkg/response"
	"github.com/iv-tunate/PAS/pkg/validate"
)

type CourseHandler struct {
	courses *service.CourseService
}

func NewCourseHandler(courses *service.CourseService) *CourseHandler {
	return &CourseHandler{courses: courses}
}

func (h *CourseHandler) List(c echo.Context) error {
	courses, err := h.courses.ListPublished(c.Request().Context())
	if err != nil {
		return response.Internal(c, "could not load courses")
	}
	return response.OK(c, "", courses)
}

func (h *CourseHandler) GetBySlug(c echo.Context) error {
	course, err := h.courses.GetBySlug(c.Request().Context(), c.Param("slug"))
	if err != nil {
		return response.NotFound(c, "course not found")
	}
	return response.OK(c, "", course)
}

func (h *CourseHandler) AdminList(c echo.Context) error {
	courses, err := h.courses.ListAllForAdmin(c.Request().Context())
	if err != nil {
		return response.Internal(c, "could not load courses")
	}
	return response.OK(c, "", courses)
}

type createCourseRequest struct {
	Title        string   `json:"title"`
	Summary      string   `json:"summary"`
	PriceKobo    int64    `json:"price_kobo"`
	IsPublished  bool     `json:"is_published"`
	ThumbnailURL string   `json:"thumbnail_url"`
	Chapters     []string `json:"chapters"`
}

func (r *createCourseRequest) Validate() error {
	return validate.Required(map[string]string{"title": r.Title})
}

func (h *CourseHandler) AdminCreate(c echo.Context) error {
	var req createCourseRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	course, err := h.courses.CreateCourse(c.Request().Context(), service.CreateCourseInput{
		Title:        req.Title,
		Summary:      req.Summary,
		PriceKobo:    req.PriceKobo,
		IsPublished:  req.IsPublished,
		ThumbnailURL: req.ThumbnailURL,
		Chapters:     req.Chapters,
	})
	if err != nil {
		return response.Internal(c, "could not create course")
	}
	return response.Created(c, "course created", course)
}

type updateCourseRequest struct {
	Title        string `json:"title"`
	Summary      string `json:"summary"`
	PriceKobo    int64  `json:"price_kobo"`
	IsPublished  bool   `json:"is_published"`
	ThumbnailURL string `json:"thumbnail_url"`
}

func (r *updateCourseRequest) Validate() error {
	return validate.Required(map[string]string{"title": r.Title})
}

func (h *CourseHandler) AdminUpdate(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.BadRequest(c, "invalid_id", "invalid course id", nil)
	}

	var req updateCourseRequest
	if err := validate.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid_request", err.Error(), nil)
	}

	course, err := h.courses.UpdateCourse(c.Request().Context(), id, req.Title, req.Summary, req.PriceKobo, req.IsPublished, req.ThumbnailURL)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return response.NotFound(c, "course not found")
		}
		return response.Internal(c, "could not update course")
	}
	return response.OK(c, "course updated", course)
}

func (h *CourseHandler) AdminDelete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.BadRequest(c, "invalid_id", "invalid course id", nil)
	}
	if err := h.courses.DeleteCourse(c.Request().Context(), id); err != nil {
		return response.Internal(c, "could not delete course")
	}
	return response.NoContent(c)
}
