-- name: ListPublishedCourses :many
-- Public: what the homepage course carousel fetches.
SELECT * FROM courses
WHERE is_published = TRUE
ORDER BY created_at DESC;

-- name: ListAllCourses :many
-- Admin: includes unpublished/draft courses.
SELECT * FROM courses
ORDER BY created_at DESC;

-- name: GetCourseBySlug :one
SELECT * FROM courses WHERE slug = $1;

-- name: GetCourseByID :one
SELECT * FROM courses WHERE id = $1;

-- name: CreateCourse :one
INSERT INTO courses (title, slug, summary, price_kobo, is_published, thumbnail_url)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateCourse :one
UPDATE courses
SET title = $2, summary = $3, price_kobo = $4, is_published = $5, thumbnail_url = $6, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteCourse :exec
DELETE FROM courses WHERE id = $1;

-- name: ListChaptersByCourse :many
SELECT * FROM course_chapters
WHERE course_id = $1
ORDER BY position ASC;

-- name: CreateChapter :one
INSERT INTO course_chapters (course_id, title, position)
VALUES ($1, $2, $3)
RETURNING *;

-- name: DeleteChapter :exec
DELETE FROM course_chapters WHERE id = $1;
