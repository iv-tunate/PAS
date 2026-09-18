-- name: CreateUser :one
INSERT INTO users (full_name, email, password_hash, role)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE lower(email) = lower($1);

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: MarkUserVerified :exec
UPDATE users SET is_verified = TRUE, updated_at = now() WHERE id = $1;

-- name: UpdateUserPassword :exec
UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1;

-- name: ListUsers :many
-- Admin: paginated user list.
SELECT * FROM users
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountUsers :one
SELECT count(*) FROM users;
