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
| Maven | 3.8+ | bundled via `mvnw` |
| Git | any | https://git-scm.com |

You also need a **Supabase** project. Get one free at https://supabase.com.

---

## 1 — Clone the Repo

```bash
git clone https://github.com/pranay-999/Shop-Site.git
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

### 3.1 Create your environment file

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DB_URL=jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
DB_USERNAME=postgres.your_project_ref
DB_PASSWORD=your_supabase_db_password
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

> **Where to find these values:**  
> Supabase dashboard → Project Settings → Database → Connection string (Transaction pooler)

### 3.2 Run the backend

**On macOS / Linux:**
```bash
cd backend
export DB_URL=jdbc:postgresql://...
export DB_USERNAME=postgres.your_project_ref
export DB_PASSWORD=your_supabase_password
export CORS_ALLOWED_ORIGINS=http://localhost:3000

./mvnw spring-boot:run
```

**On Windows (Command Prompt):**
```cmd
cd backend
set DB_URL=jdbc:postgresql://...
set DB_USERNAME=postgres.your_project_ref
set DB_PASSWORD=your_supabase_password
set CORS_ALLOWED_ORIGINS=http://localhost:3000

mvnw.cmd spring-boot:run
```

**On Windows (PowerShell):**
```powershell
cd backend
$env:DB_URL="jdbc:postgresql://..."
$env:DB_USERNAME="postgres.your_project_ref"
$env:DB_PASSWORD="your_supabase_password"
$env:CORS_ALLOWED_ORIGINS="http://localhost:3000"

.\mvnw spring-boot:run
```

Backend starts at **http://localhost:8080/api**

### 3.3 Verify it's running

```bash
curl http://localhost:8080/api/stocks
# Should return [] or a list of stocks
```

---

## 4 — Database (Supabase)

The backend uses **JPA with `ddl-auto: update`** — it creates/updates tables automatically on first startup. You do **not** need to run any SQL manually.

Tables created automatically:
- `stocks` — inventory items
- `bills` — customer invoices
- `bill_items` — line items on each bill
- `bill_history` — edit snapshots for audit trail
- `categories` — product categories (seeded on first run)

Default categories seeded on startup:
1. Tiles
2. Electronics
3. Sanitary Ware
4. Faucets & Fixtures
5. Hardware
6. Other

---

## 5 — Running Both Together

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd Shop-Site/backend
export DB_PASSWORD=your_password   # plus other env vars
./mvnw spring-boot:run
```

**Terminal 2 — Frontend:**
```bash
cd Shop-Site
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
| GET | `/api/stocks/search?q=` | Search by design name |
| GET | `/api/stocks/low-stock?threshold=10` | Low stock items |
| GET | `/api/stocks/stats/total` | Total item count |
| GET | `/api/stocks/stats/low-count` | Low stock count |
| POST | `/api/stocks` | Create stock |
| PUT | `/api/stocks/{id}` | Update stock |
| PATCH | `/api/stocks/{id}/adjust?delta=` | Adjust box count |
| DELETE | `/api/stocks/{id}` | Delete stock |

### Bills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bills` | Get all bills |
| GET | `/api/bills/{id}` | Get bill by numeric ID |
| GET | `/api/bills/number/{billNumber}` | Get bill by bill number |
| GET | `/api/bills/search?q=` | Search bills |
| GET | `/api/bills/next-bill-number` | Auto-generate next bill number |
| GET | `/api/bills/by-stock?designName=` | Bills containing a stock item |
| POST | `/api/bills` | Create bill (deducts stock) |
| POST | `/api/bills/check-bill-number` | Check if bill number exists |
| PUT | `/api/bills/{billNumber}` | Update bill (restores+rededucts stock) |
| DELETE | `/api/bills/{billNumber}` | Delete bill (restores stock) |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |

---

## 8 — CSV Upload Format

To bulk-upload stock via CSV, use this exact format:

```csv
design_name,type,size,total_boxes
Premium Marble Tile,Ceramic,12x12,150
Granite Tile,Natural Stone,18x18,100
Porcelain White,Porcelain,24x24,200
```

Download the template from the **Add Stock → Excel Upload** tab in the app.

---

## 9 — Build for Production

### Frontend
```bash
npm run build
npm start
```

Or deploy to **Vercel** (recommended):
1. Push to GitHub
2. Import repo in https://vercel.com
3. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend-url/api`

### Backend
```bash
cd backend
./mvnw clean package -DskipTests
java -jar target/tiles-sanitary-backend-1.0.0.jar
```

Set these env vars on your server/platform:
```
DB_URL=jdbc:postgresql://...
DB_USERNAME=postgres.your_ref
DB_PASSWORD=your_password
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
PORT=8080
```

Deploy backend to **Railway**, **Render**, or **Fly.io**.

---

## 10 — Common Issues

**Backend won't start — `DB_PASSWORD` missing**
```
Could not resolve placeholder 'DB_PASSWORD'
```
→ You must set the `DB_PASSWORD` env var. It has no default for security reasons.

**Frontend shows "backend not running"**  
→ Make sure Spring Boot is running on port 8080 and `NEXT_PUBLIC_API_URL` matches.

**CORS error in browser console**  
→ Make sure `CORS_ALLOWED_ORIGINS` on the backend matches your frontend URL exactly (no trailing slash).

**Tables not created on startup**  
→ Check your DB credentials. JPA will log the error. Make sure the Supabase project is active (free projects pause after 1 week of inactivity).

**Duplicate design name error on stock create**  
→ Each design name must be unique within a category. Use a different name or different category.