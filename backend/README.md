# Billing backend (Express + MySQL)

## Run from this folder

The API project lives in **`backend`** (inside your repo). If you see `Cannot find module ... server.js`, you are in the wrong directory.

```bash
cd backend
npm install
npm start
```

Do **not** use a `backend.js` path — that folder name is incorrect for this project.

## Setup

1. Create DB: `mysql -u root -p < schema.sql` (drops existing tables).
2. Copy `.env.example` to `.env` and set `DB_PASSWORD` (and optional `CORS_ORIGIN`).
3. From **`backend`**: `npm install` && `npm start` (default port **3000**).

On start, the server checks MySQL first. If the check fails, it prints the error and exits (so you know the DB is the problem, not Express).

## CORS

Set `CORS_ORIGIN` to your React dev server (e.g. `http://localhost:5173`). If unset, all origins are allowed (fine for local dev with Vite proxy).

## API summary

| Method | Path | Notes |
|--------|------|--------|
| GET/POST | `/customers` | Body: `name`, optional `address`, `pan_number`, `gst_number`, `status` (Active/Inactive) |
| PUT/DELETE | `/customers/:id` | Numeric `customer_id` |
| GET/POST | `/items` | Body: `item_id` (e.g. IT00001), `item_name`, `price`, `status`. Also accepts `name` / `item_code` aliases. |
| PUT/DELETE | `/items/:id` | `:id` is `item_id` string |
| POST | `/invoice` | `{ customer_id, items: [{ item_id, quantity }] }` — only **Active** items and customers |
| GET | `/invoices` | `?customer_id=&limit=` |
| GET | `/invoices/:id` | Full invoice |

## Schema

- **customers:** `customer_id`, `name`, `address`, `pan_number`, `gst_number`, `status`
- **items:** `item_id` (VARCHAR PK), `item_name`, `price`, `status`
- **invoices / invoice_items:** unchanged flow; `invoice_items.item_id` references `items.item_id`

GST: non-empty `gst_number` → no extra 18%; blank → GST applied.

## Structure

- `models/` — SQL access (MVC)
- `controllers/` — HTTP + validation
- `routes/`, `validators/`, `services/`, `utils/`
