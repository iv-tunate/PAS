-- name: EnrollUserInCourse :one
INSERT INTO enrollments (user_id, course_id)
VALUES ($1, $2)
ON CONFLICT (user_id, course_id) DO NOTHING
RETURNING *;

-- name: ListUserEnrollments :many
-- Used to gate access: which course IDs this signed-in user can open.
SELECT course_id FROM enrollments WHERE user_id = $1;

-- name: IsUserEnrolled :one
SELECT EXISTS (
    SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2
) AS enrolled;
