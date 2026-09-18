-- name: CreateSubscriber :one
INSERT INTO subscribers (email)
VALUES ($1)
ON CONFLICT (lower(email)) DO NOTHING
RETURNING *;

-- name: MarkSubscriberSynced :exec
UPDATE subscribers SET brevo_synced = TRUE WHERE email = $1;

-- name: ListSubscribers :many
-- Admin: paginated subscriber list, e.g. for export.
SELECT * FROM subscribers
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountSubscribers :one
SELECT count(*) FROM subscribers;
