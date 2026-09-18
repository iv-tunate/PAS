-- name: CreateBookPurchase :one
INSERT INTO book_purchases (user_id, book_id, gateway, reference, amount, currency, status)
VALUES ($1, $2, $3, $4, $5, $6, 'pending')
RETURNING *;

-- name: GetBookPurchaseByReference :one
SELECT * FROM book_purchases WHERE reference = $1;

-- name: MarkBookPurchaseStatus :one
UPDATE book_purchases SET status = $2, updated_at = now()
WHERE reference = $1
RETURNING *;

-- name: ListMyPurchasedBooks :many
SELECT b.* FROM books b
JOIN book_purchases bp ON bp.book_id = b.id
WHERE bp.user_id = $1 AND bp.status = 'success'
ORDER BY bp.created_at DESC;

-- name: ListBookPurchases :many
-- Admin: paginated purchase log across all three gateways.
SELECT * FROM book_purchases
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
