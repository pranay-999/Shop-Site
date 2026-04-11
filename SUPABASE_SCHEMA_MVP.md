# Supabase Schema Review (MVP)

## What we can verify right now
This repo cannot directly read your live Supabase project without `NEXT_PUBLIC_SUPABASE_URL` + service credentials in this environment.

So this review is based on:
- `POSTGRESQL_SETUP.sql`
- current frontend Supabase queries in `lib/services/*`

## Current table relationships (MVP)

### `product_categories`
- Stores category metadata (name, slug, icon, color).
- Parent table for stock categories.

### `stocks`
- Stores inventory rows (design, type, size, quantity, price, category).
- FK: `category_id -> product_categories.id`.
- Used directly by frontend stock CRUD.

### `bills`
- Stores bill header (bill number, customer name/phone, totals/tax).
- Parent table for bill line items.

### `bill_items`
- Stores bill line rows (design snapshot, size/type, quantity, pricing).
- FK: `bill_id -> bills.id`.
- **MVP improvement added in SQL**: `stock_id -> stocks.id` (nullable) so each item can optionally point to original stock.

## Missing tables vs intended long-term schema
For your mention of `products`, `users`, `tenants`, `customers`:
- Not present in current MVP schema.
- For MVP, you do **not** need all of them now.

Recommended minimal additions (only when needed):
1. `customers` (if you need search/history beyond phone/name text in bills).
2. `tenants` + `tenant_id` columns (only if multi-shop/multi-company is required).
3. `products` is optional because `stocks` is already acting as your product/inventory table.
4. `users` usually comes from Supabase Auth (`auth.users`), so avoid duplicating unless app-specific profile fields are needed.

## Minimal SQL fixes for current app
1. Keep `stocks.category_id` FK to `product_categories.id`.
2. Keep `bill_items.bill_id` FK to `bills.id`.
3. Add `bill_items.stock_id` FK to `stocks.id` (nullable, `ON DELETE SET NULL`) to preserve history when stock is deleted.
4. Optional compatibility view if some code expects `categories` table name:
   - `CREATE VIEW categories AS SELECT * FROM product_categories;`


### Existing-project migration note
If your project was created before `stock_id` was added to `bill_items`, run `SUPABASE_MIGRATION_FIX.sql` once to add column/FK/index safely.

## Frontend query compatibility check
Current services are compatible with current/updated schema:
- `lib/services/stocks.ts`
  - reads/writes `stocks` using snake_case DB columns.
- `lib/services/bills.ts`
  - writes `bills` + `bill_items`.
  - first attempts insert with `stock_id`; if column is missing in old DB, falls back to legacy insert without `stock_id`.

## Why "Add Stock" will upload to Supabase now
`Add Stock` page calls `createStock()` from `lib/services/stocks.ts`, which runs:
- `insert into stocks (design_name, type, size, total_boxes, price_per_box, category_id)`

So data is written directly to Supabase (not to Spring backend) as long as:
1. Supabase env vars are set.
2. table `stocks` exists.
3. RLS policy allows insert for your client role.
