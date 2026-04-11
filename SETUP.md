# Setup Guide (Current Architecture)

This project currently runs as:
- **Frontend:** Next.js app (direct Supabase REST calls)
- **Backend:** Spring Boot API/business layer in **in-memory mode** (no JDBC requirement)

## 1) Frontend Setup (required)

### Prerequisites
- Node.js 18+

### Steps
1. Install deps:
   ```bash
   npm install
   ```
2. Create `.env.local` with your Supabase project values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
3. Run app:
   ```bash
   npm run dev
   ```

## 2) Supabase Database Setup (required once per project)

Yes — you should run `POSTGRESQL_SETUP.sql` in your Supabase SQL Editor **once** for initial schema/data setup.

File to run:
- `POSTGRESQL_SETUP.sql`

This creates:
- `product_categories`
- `stocks`
- `bills`
- `bill_items`

and sets FK relations needed by current frontend queries.

## 3) Backend Setup (optional for frontend CRUD)

Backend now starts without DB dependency:
```bash
cd backend
mvn spring-boot:run
```

It is useful for API/business logic routes but frontend stock/bill CRUD now talks directly to Supabase.

---

## Why you got this error

> `Module not found: Can't resolve '@supabase/supabase-js'`

That happens when code imports the Supabase SDK package but it is missing in local `node_modules`.

In this branch, that dependency was removed from runtime path and replaced with direct REST calls in:
- `lib/supabase.ts`
- `lib/services/stocks.ts`
- `lib/services/bills.ts`

So if you still see this exact import error, you are likely running an older commit or stale cache.

### Fix checklist
1. Pull latest branch changes.
2. Remove local build cache:
   ```bash
   rm -rf .next
   ```
3. Reinstall deps:
   ```bash
   npm install
   ```
4. Restart dev server:
   ```bash
   npm run dev
   ```


### If you see: column "stock_id" of relation "bill_items" does not exist

Your project has an older `bill_items` table. Run migration file once:

```bash
# copy-paste SQL from this file into Supabase SQL Editor
SUPABASE_MIGRATION_FIX.sql
```

Then rerun your bill insert query.

## Quick verification commands

```bash
rg -n "@supabase/supabase-js" lib app
```
Should return no matches.

```bash
npm run build
```
Should compile successfully.
