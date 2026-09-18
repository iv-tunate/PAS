-- name: ListPublishedBooks :many
SELECT * FROM books
WHERE is_published = TRUE
ORDER BY created_at DESC;

-- name: ListAllBooks :many
-- Admin: includes unpublished/draft books.
SELECT * FROM books
ORDER BY created_at DESC;

-- name: GetBookByID :one
SELECT * FROM books WHERE id = $1;

-- name: CreateBook :one
INSERT INTO books (title, author, description, cover_image_url, file_url, price_kobo, price_usd_cents, is_published)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: UpdateBook :one
UPDATE books
SET title = $2, author = $3, description = $4, cover_image_url = $5, file_url = $6,
    price_kobo = $7, price_usd_cents = $8, is_published = $9, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteBook :exec
DELETE FROM books WHERE id = $1;
