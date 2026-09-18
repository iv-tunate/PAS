package service

import (
	"context"
	"log/slog"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/iv-tunate/PAS/internal/db/sqlc"
)

type CourseService struct {
	queries *sqlc.Queries
	log     *slog.Logger
}

func NewCourseService(pool *pgxpool.Pool, log *slog.Logger) *CourseService {
	return &CourseService{queries: sqlc.New(pool), log: log}
}

type CourseWithChapters struct {
	sqlc.Course
	Chapters []sqlc.CourseChapter `json:"chapters"`
}

func (s *CourseService) ListPublished(ctx context.Context) ([]CourseWithChapters, error) {
	courses, err := s.queries.ListPublishedCourses(ctx)
	if err != nil {
		return nil, err
	}
	return s.attachChapters(ctx, courses)
}

func (s *CourseService) ListAllForAdmin(ctx context.Context) ([]CourseWithChapters, error) {
	courses, err := s.queries.ListAllCourses(ctx)
	if err != nil {
		return nil, err
	}
	return s.attachChapters(ctx, courses)
}

func (s *CourseService) attachChapters(ctx context.Context, courses []sqlc.Course) ([]CourseWithChapters, error) {
	out := make([]CourseWithChapters, 0, len(courses))
	for _, c := range courses {
		chapters, err := s.queries.ListChaptersByCourse(ctx, c.ID)
		if err != nil {
			return nil, err
		}
		out = append(out, CourseWithChapters{Course: c, Chapters: chapters})
	}
	return out, nil
}

func (s *CourseService) GetByID(ctx context.Context, id uuid.UUID) (sqlc.Course, error) {
	return s.queries.GetCourseByID(ctx, id)
}

func (s *CourseService) GetBySlug(ctx context.Context, slug string) (CourseWithChapters, error) {
	course, err := s.queries.GetCourseBySlug(ctx, slug)
	if err != nil {
		return CourseWithChapters{}, err
	}
	chapters, err := s.queries.ListChaptersByCourse(ctx, course.ID)
	if err != nil {
		return CourseWithChapters{}, err
	}
	return CourseWithChapters{Course: course, Chapters: chapters}, nil
}

type CreateCourseInput struct {
	Title        string
	Summary      string
	PriceKobo    int64
	IsPublished  bool
	ThumbnailURL string
	Chapters     []string // ordered chapter titles
}

// CreateCourse is admin-only (enforced by route middleware, not here —
// this layer trusts its caller already checked authorization).
func (s *CourseService) CreateCourse(ctx context.Context, in CreateCourseInput) (CourseWithChapters, error) {
	slug := slugify(in.Title)

	course, err := s.queries.CreateCourse(ctx, sqlc.CreateCourseParams{
		Title:        in.Title,
		Slug:         slug,
		Summary:      in.Summary,
		PriceKobo:    in.PriceKobo,
		IsPublished:  in.IsPublished,
		ThumbnailUrl: in.ThumbnailURL,
	})
	if err != nil {
		return CourseWithChapters{}, err
	}

	chapters := make([]sqlc.CourseChapter, 0, len(in.Chapters))
	for i, title := range in.Chapters {
		ch, err := s.queries.CreateChapter(ctx, sqlc.CreateChapterParams{
			CourseID: course.ID,
			Title:    title,
			Position: int32(i),
		})
		if err != nil {
			return CourseWithChapters{}, err
		}
		chapters = append(chapters, ch)
	}

	s.log.Info("course created", "course_id", course.ID, "title", course.Title)
	return CourseWithChapters{Course: course, Chapters: chapters}, nil
}

func (s *CourseService) UpdateCourse(ctx context.Context, id uuid.UUID, title, summary string, priceKobo int64, isPublished bool, thumbnailURL string) (sqlc.Course, error) {
	return s.queries.UpdateCourse(ctx, sqlc.UpdateCourseParams{
		ID:           id,
		Title:        title,
		Summary:      summary,
		PriceKobo:    priceKobo,
		IsPublished:  isPublished,
		ThumbnailUrl: thumbnailURL,
	})
}

func (s *CourseService) DeleteCourse(ctx context.Context, id uuid.UUID) error {
	return s.queries.DeleteCourse(ctx, id)
}

func slugify(title string) string {
	s := strings.ToLower(strings.TrimSpace(title))
	s = strings.ReplaceAll(s, " ", "-")
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			b.WriteRune(r)
		}
	}
	return b.String()
}
