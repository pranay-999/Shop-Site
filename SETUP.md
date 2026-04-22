# StockFlow — Setup Guide

Tiles & Sanitary Inventory Management System  
**Frontend:** Next.js 15 · TypeScript · Tailwind · shadcn/ui  
**Backend:** Spring Boot 3.2 · Java 17 · JPA  
**Database:** Supabase (PostgreSQL)

---

## Project Structure

```
Shop-Site/
│
├── app/                              # Next.js App Router (pages)
│   ├── (dashboard)/                  # Route group — all main pages
│   │   ├── analytics/page.tsx        # Analytics dashboard
│   │   ├── bills/
│   │   │   ├── page.tsx              # View & manage all bills
│   │   │   ├── loading.tsx
│   │   │   └── edit/
│   │   │       ├── [id]/page.tsx     # Edit bill by numeric ID
│   │   │       ├── [id]/loading.tsx
│   │   │       └── search/page.tsx   # Search bill to edit
│   │   ├── sales/
│   │   │   ├── page.tsx              # Create new sale / bill
│   │   │   └── loading.tsx
│   │   └── stocks/
│   │       ├── page.tsx              # Manage inventory
│   │       ├── loading.tsx
│   │       └── add/page.tsx          # Add stock (manual or CSV)
│   ├── globals.css                   # Global styles + Tailwind CSS vars
│   ├── layout.tsx                    # Root layout (providers, metadata)
│   ├── loading.tsx                   # Root loading spinner
│   └── page.tsx                      # Homepage / dashboard
│
├── components/                       # Reusable components
│   ├── layout/
│   │   ├── navigation-header.tsx     # Top nav with breadcrumbs + theme toggle
│   │   └── category-selector.tsx     # Category dropdown (Tiles / Sanitary etc.)
│   ├── theme-provider.tsx
│   └── ui/                           # shadcn/ui primitives (auto-generated)
│       └── (button, card, dialog, table, select …)
│
├── context/
│   └── CategoryContext.tsx           # Global selected-category state
│
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
│
├── lib/
│   ├── api.ts                        # apiFetch helper + API_BASE env var
│   ├── types.ts                      # Shared TypeScript types (Stock, Bill …)
│   ├── utils.ts                      # cn() utility
│   ├── validations.ts
│   └── services/
│       ├── stocks.ts                 # Stock API calls
│       ├── bills.ts                  # Bill API calls
│       └── index.ts
│
├── public/                           # Static assets
│   ├── icon.svg
│   ├── icon-light-32x32.png
│   ├── icon-dark-32x32.png
│   └── apple-icon.png
│
├── backend/                          # Spring Boot backend
│   ├── src/main/java/com/inventory/
│   │   ├── TilesSanitaryBackendApplication.java
│   │   ├── config/
│   │   │   ├── WebConfig.java        # Global CORS config
│   │   │   ├── DataInitializer.java  # Seeds default categories on startup
│   │   │   └── StorageModeLogger.java
│   │   ├── controller/
│   │   │   ├── StockController.java
│   │   │   ├── BillController.java
│   │   │   ├── CategoryController.java
│   │   │   └── DashboardController.java
│   │   ├── service/
│   │   │   ├── StockService.java
│   │   │   ├── BillService.java
│   │   │   └── CategoryService.java
│   │   ├── model/
│   │   │   ├── Stock.java
│   │   │   ├── Bill.java
│   │   │   ├── BillItem.java
│   │   │   ├── BillHistory.java
│   │   │   └── Category.java
│   │   ├── dto/
│   │   │   ├── StockDTO.java
│   │   │   ├── BillDTO.java
│   │   │   ├── BillItemDTO.java
│   │   │   ├── BillSnapshotDTO.java
│   │   │   └── CategoryDTO.java
│   │   └── repository/
│   │       ├── StockRepository.java
│   │       ├── BillRepository.java
│   │       ├── BillHistoryRepository.java
│   │       └── CategoryRepository.java
│   ├── src/main/resources/
│   │   └── application.yml           # Spring Boot config (DB, CORS, server)
│   ├── pom.xml
│   └── .env.example                  # Backend env var template
│
├── .env.example                      # Frontend env var template
├── .gitignore
├── components.json                   # shadcn/ui config
├── eslint.config.mjs
├── next.config.mjs
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| Java JDK | 17+ | https://adoptium.net |
| Maven | 3.8+ | https://maven.apache.org/install.html |
| Git | any | https://git-scm.com |

You also need a **Supabase** project. Get one free at https://supabase.com.

---

## 1 — Clone the Repo

```bash
git clone https://github.com/YOUR_USERNAME/Shop-Site.git
cd Shop-Site
```

---

## 2 — Frontend Setup (Next.js)

### 2.1 Install dependencies

```bash
npm install
```

### 2.2 Create your environment file

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# URL of your Spring Boot backend
# Local dev:
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Production (replace with your deployed backend URL):
# NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

### 2.3 Start the dev server

```bash
npm run dev
```

Opens at **http://localhost:3000**

---

## 3 — Backend Setup (Spring Boot)

### 3.1 Set your database credentials

The backend reads DB credentials from environment variables. You need to set these before running.

> **Where to find these values:**  
> Supabase dashboard → Project Settings → Database → Connection string → **Session pooler** tab  
> Copy the host, port, username, and password shown there.

> **Important:** The JDBC URL must include `?prepareThreshold=0` at the end.  
> Without it you will get `prepared statement already exists` errors at runtime.  
> This is required because Supabase uses a connection pooler that doesn't support server-side prepared statements.

### 3.2 Run the backend

**On Windows (PowerShell) — recommended:**
```powershell
cd backend
$env:DB_URL="jdbc:postgresql://aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?prepareThreshold=0"
$env:DB_USERNAME="postgres.your_project_ref"
$env:DB_PASSWORD="your_supabase_password"
$env:CORS_ALLOWED_ORIGINS="http://localhost:3000"

mvn spring-boot:run
```

**On Windows (Command Prompt):**
```cmd
cd backend
set DB_URL=jdbc:postgresql://aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?prepareThreshold=0
set DB_USERNAME=postgres.your_project_ref
set DB_PASSWORD=your_supabase_password
set CORS_ALLOWED_ORIGINS=http://localhost:3000

mvn spring-boot:run
```

**On macOS / Linux:**
```bash
cd backend
export DB_URL="jdbc:postgresql://aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?prepareThreshold=0"
export DB_USERNAME="postgres.your_project_ref"
export DB_PASSWORD="your_supabase_password"
export CORS_ALLOWED_ORIGINS="http://localhost:3000"

mvn spring-boot:run
```

Backend starts at **http://localhost:8080/api**

### 3.3 Verify it's running

```bash
curl http://localhost:8080/api/stocks
# Should return [] or a list of stocks
```

---

## 4 — Database (Supabase)

The backend uses **JPA with `ddl-auto: update`** — it creates and updates tables automatically on first startup. You do **not** need to run any SQL manually.

### Tables created automatically

| Table | Description |
|-------|-------------|
| `stocks` | Inventory items (design name, size, type, box counts, price) |
| `bills` | Customer invoices (bill number, customer, totals, GST) |
| `bill_items` | Line items on each bill (linked to stock) |
| `bill_history` | Edit snapshots — full audit trail of every bill change |
| `product_categories` | Product categories (seeded on first run) |

### Default categories seeded on first startup

| ID | Name | Slug |
|----|------|------|
| 1 | Tiles | tiles |
| 2 | Electronics | electronics |
| 3 | Sanitary Ware | sanitary-ware |
| 4 | Faucets & Fixtures | faucets |
| 5 | Hardware | hardware |
| 6 | Other | other |

### Stock table fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Auto-generated primary key |
| `design_name` | String | Product name |
| `size` | String | e.g. 24x24, 12x18 |
| `type` | String | e.g. Ceramic, Porcelain |
| `initial_boxes` | Integer | Boxes when first added |
| `sold_boxes` | Integer | Total boxes sold so far |
| `total_boxes` | Integer | Current remaining boxes |
| `price_per_box` | Double | Price per box |
| `category_id` | Long | FK to product_categories |
| `created_at` | Timestamp | Auto-set on create |
| `updated_at` | Timestamp | Auto-set on update |

### Bill table fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Long | Auto-generated primary key |
| `bill_number` | String | Unique e.g. INV-20260422-001 |
| `customer_name` | String | Customer full name |
| `phone_number` | String | 10-digit phone |
| `subtotal` | Double | Sum before GST/discount |
| `gst_rate` | Double | GST % (0, 5, 12, 18, 28) |
| `gst_type` | String | INCLUSIVE or EXCLUSIVE |
| `gst_amount` | Double | Calculated GST amount |
| `discount` | Double | Flat discount amount |
| `total_amount` | Double | Final amount |
| `is_edited` | Boolean | True if bill was ever edited |
| `edited_at` | Timestamp | When last edited |
| `created_at` | Timestamp | Auto-set on create |
| `updated_at` | Timestamp | Auto-set on update |

---

## 5 — Running Both Together

Open **two terminals**:

**Terminal 1 — Backend:**
```powershell
cd backend
$env:DB_PASSWORD="your_supabase_password"
mvn spring-boot:run
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## 6 — Available Routes

| URL | Page |
|-----|------|
| `/` | Homepage — stats + quick nav |
| `/stocks` | Manage inventory |
| `/stocks/add` | Add stock (manual or CSV upload) |
| `/sales` | Create a new sale / bill |
| `/bills` | View all invoices |
| `/bills/edit/search` | Search for a bill to edit |
| `/bills/edit/[id]` | Edit a specific bill |
| `/analytics` | Sales analytics dashboard |

---

## 7 — API Endpoints Reference

### Stocks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stocks` | Get all stocks |
| GET | `/api/stocks/{id}` | Get stock by ID |
| GET | `/api/stocks/search?q=` | Search by design name, size, type |
| GET | `/api/stocks/low-stock?threshold=10` | Items below threshold |
| GET | `/api/stocks/stats/total` | Total item count |
| GET | `/api/stocks/stats/low-count` | Low stock count |
| POST | `/api/stocks` | Create stock |
| PUT | `/api/stocks/{id}` | Update stock |
| PATCH | `/api/stocks/{id}/adjust?delta=` | Adjust box count (+ or -) |
| DELETE | `/api/stocks/{id}` | Delete stock |

### Bills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bills` | Get all bills |
| GET | `/api/bills/{id}` | Get bill by numeric ID |
| GET | `/api/bills/number/{billNumber}` | Get bill by bill number string |
| GET | `/api/bills/search?q=` | Search by bill number / customer / phone |
| GET | `/api/bills/next-bill-number` | Auto-generate next bill number |
| GET | `/api/bills/by-stock?designName=` | Bills containing a stock design |
| GET | `/api/bills/filter/today` | Today's bills |
| GET | `/api/bills/filter/past-week` | Last 7 days |
| GET | `/api/bills/filter/past-month` | Last 30 days |
| POST | `/api/bills` | Create bill (auto-deducts stock) |
| POST | `/api/bills/check-bill-number` | Check if bill number already exists |
| PUT | `/api/bills/{billNumber}` | Update bill (restores old stock, deducts new) |
| DELETE | `/api/bills/{billNumber}` | Delete bill (restores stock) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/{id}` | Get category by ID |
| GET | `/api/categories/slug/{slug}` | Get category by slug |
| POST | `/api/categories` | Create new category |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Total items, low stock count, total bills, today's revenue |
| GET | `/api/dashboard/low-stock` | Low stock items with count |

---

## 8 — CSV Upload Format

To bulk-upload stock via CSV, use this exact column order:

```csv
design_name,type,size,total_boxes,price_per_box
Premium Marble Tile,Ceramic,12x12,150,450
Granite Tile,Natural Stone,18x18,100,800
Porcelain White,Porcelain,24x24,200,350
```

- `design_name`, `type`, `size`, `total_boxes` are **required**
- `price_per_box` is optional (defaults to 0 if omitted)
- First row must be the header row exactly as shown above

---

## 9 — Build for Production

### Frontend
```bash
npm run build
npm start
```

Or deploy to **Vercel** (recommended):
1. Push to GitHub
2. Import repo at https://vercel.com
3. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend-url/api`

### Backend
```bash
cd backend
mvn clean package -DskipTests
java -jar target/tiles-sanitary-backend-1.0.0.jar
```

Set these env vars on your server / deployment platform:
```
DB_URL=jdbc:postgresql://YOUR_SUPABASE_HOST:6543/postgres?prepareThreshold=0
DB_USERNAME=postgres.your_project_ref
DB_PASSWORD=your_supabase_password
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
PORT=8080
```

Recommended backend deployment platforms: **Railway**, **Render**, **Fly.io**

---

## 10 — Common Issues

**`DB_PASSWORD` env var not set — backend won't start**
```
Could not resolve placeholder 'DB_PASSWORD'
```
→ Set `DB_PASSWORD` as an environment variable before running. See section 3.2.

**`prepared statement "S_X" already exists` errors**
```
ERROR: prepared statement "S_7" already exists
```
→ Your JDBC URL is missing `?prepareThreshold=0`. Add it to the end of `DB_URL`. This is required for Supabase Session Pooler.

**Frontend shows "backend not running" or "Failed to load"**  
→ Make sure Spring Boot is running on port 8080 and `NEXT_PUBLIC_API_URL` in `.env.local` points to `http://localhost:8080/api`.

**CORS error in browser console**  
→ `CORS_ALLOWED_ORIGINS` on the backend must match your frontend URL exactly — no trailing slash, correct protocol (http vs https).

**Tables not created on startup**  
→ Check DB credentials. JPA logs the error on startup. Also check that your Supabase project is active — free projects pause after 1 week of inactivity. Resume it from the Supabase dashboard.

**Duplicate design name error when creating stock**  
→ Each design name must be unique within the same category. Use a different name or assign to a different category.

**Bill number already exists error**  
→ The bill number auto-generates on page load. If you see this error, refresh the sales page to get a fresh number.