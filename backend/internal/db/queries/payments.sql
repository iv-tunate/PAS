-- name: CreatePayment :one
INSERT INTO payments (user_id, course_id, paystack_reference, amount_kobo, status)
VALUES ($1, $2, $3, $4, 'pending')
RETURNING *;

-- name: GetPaymentByReference :one
SELECT * FROM payments WHERE paystack_reference = $1;

-- name: MarkPaymentStatus :one
UPDATE payments SET status = $2, updated_at = now()
WHERE paystack_reference = $1
RETURNING *;

-- name: ListPayments :many
-- Admin: paginated payment log.
SELECT * FROM payments
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: SumSuccessfulPaymentsKobo :one
-- Admin dashboard: total revenue.
SELECT COALESCE(SUM(amount_kobo), 0)::BIGINT AS total_kobo
FROM payments
WHERE status = 'success';
