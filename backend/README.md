# Grow with Akintola Samuel — Backend

Go + Echo API backing the frontend: auth, courses, payments (Paystack),
mailing list (Brevo), file uploads (Cloudinary), and an admin dashboard.

## Stack

- **Echo** — HTTP framework
- **Postgres** via **pgx/v5**
- **sqlc** — generates type-safe Go from the SQL in `internal/db/queries`
- **goose** — SQL migrations in `internal/db/migrations`
- **JWT** (access + rotating refresh tokens) for auth
- **Paystack** for payments, **Brevo** for email, **Cloudinary** for uploads

## One-time setup

You'll need: Go 1.22+, a Postgres database (local, or a free one from
[Neon](https://neon.tech) or [Supabase](https://supabase.com)), and the
`sqlc` and `goose` CLIs:

```bash
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
go install github.com/pressly/goose/v3/cmd/goose@latest
```

Then:

```bash
cp .env.example .env

go mod tidy          # downloads dependencies, writes go.sum
make sqlc             # generates internal/db/sqlc from the query files
make migrate-up        # creates every table in your database
make run                # starts the API on :8080
```

Check it's alive: `curl http://localhost:8080/health`

## Every time you change a query or add a migration

```bash
make migrate-up   # after adding a new .sql file in internal/db/migrations
make sqlc          # after changing anything in internal/db/queries
```

## API reference

All responses share one JSON envelope:
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### Public
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/auth/signup` | Create a student account |
| POST | `/api/v1/auth/login` | Returns access + refresh token |
| POST | `/api/v1/auth/refresh` | Exchange refresh token for a new pair |
| POST | `/api/v1/auth/logout` | Revoke one refresh token |
| POST | `/api/v1/auth/forgot-password` | Email a password reset link (always responds the same way, registered or not) |
| POST | `/api/v1/auth/reset-password` | Set a new password using the token from that email |
| GET | `/api/v1/courses` | Published courses + chapters (what the homepage shows) |
| GET | `/api/v1/courses/:slug` | One course |
| GET | `/api/v1/books` | Published books |
| GET | `/api/v1/settings` | Pastor's bio, photo, stats — what About section renders |
| POST | `/api/v1/newsletter/subscribe` | Add an email to the mailing list |
| POST | `/api/v1/payments/webhook` | Paystack calls this (course payments) — do not call it yourself |
| POST | `/api/v1/books/webhook/paystack` | Paystack calls this (book payments) |
| POST | `/api/v1/books/webhook/flutterwave` | Flutterwave calls this (book payments) |
| POST | `/api/v1/books/webhook/stripe` | Stripe calls this (book payments) |

### Requires login (`Authorization: Bearer <access_token>`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/me` | Who am I |
| POST | `/api/v1/payments/initialize` | Start Paystack checkout for a course |
| GET | `/api/v1/payments/verify/:reference` | Manually re-check a payment |
| POST | `/api/v1/courses/:id/enroll-free` | Enroll in a free course |
| GET | `/api/v1/my-enrollments` | Course IDs the user has access to |
| POST | `/api/v1/books/:id/checkout` | Start a book purchase (`{"gateway": "paystack" \| "flutterwave" \| "stripe"}`) |
| GET | `/api/v1/books/verify/:reference` | Manually re-check a book purchase |
| GET | `/api/v1/my-books` | Books the user has successfully bought |

### Requires admin role
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/admin/stats` | Dashboard numbers |
| GET | `/api/v1/admin/users` | Paginated user list |
| GET | `/api/v1/admin/payments` | Paginated payment log |
| GET | `/api/v1/admin/subscribers` | Paginated subscriber list |
| GET/POST/PUT/DELETE | `/api/v1/admin/courses` | Course management |
| GET/POST/PUT/DELETE | `/api/v1/admin/books` | Book catalog management |
| GET | `/api/v1/admin/book-purchases` | Paginated book purchase log, across all gateways |
| PUT | `/api/v1/admin/settings` | Edit pastor's bio/photo/stats |
| GET | `/api/v1/admin/uploads/signature?folder=courses\|pastor-photo` | Get a signed Cloudinary upload |

## Making the first admin account

There's no public "become admin" endpoint on purpose. Sign up normally
through the frontend, then promote yourself directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-real-email@example.com';
```

## How uploads actually work

The Go server never receives the uploaded file. The frontend asks
`/api/v1/admin/uploads/signature` for a one-time signed request, then
uploads the file **directly** to Cloudinary using that signature. Your
Cloudinary API secret stays server-side the whole time — it's used to
compute the signature, never sent to the browser.

## How payments actually work

1. Frontend calls `POST /payments/initialize` with a `course_id`.
2. Backend looks up the course's real price (never trusts a
   client-supplied amount), creates a `pending` payment row, and asks
   Paystack for a checkout URL.
3. Frontend redirects the user to that URL to pay.
4. Paystack calls `POST /payments/webhook` with a signed event once
   payment completes — the backend verifies the HMAC signature, marks
   the payment `success`, and enrolls the user in the course.
5. As a fallback (webhooks can occasionally be delayed), the frontend's
   payment callback page also calls `GET /payments/verify/:reference`,
   which independently re-checks with Paystack.

## Deploying

Any host that runs a Go binary works: [Railway](https://railway.app),
[Render](https://render.com), [Fly.io](https://fly.io), or a plain VPS.
Set every variable from `.env.example` as a real environment variable on
the host, point `DATABASE_URL` at your production Postgres, run
`make migrate-up` once against it, then deploy `make build`'s output.

Remember to set `FRONTEND_URL` to your real deployed frontend URL —
CORS and the Paystack callback both depend on it being correct.
