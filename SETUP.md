# Tiles & Sanitary Shop - Full Stack Setup Guide

This project is organized with a **Frontend (Next.js)** and **Backend (Java Spring Boot)** architecture.

## Project Structure

```
tiles-sanitary-shop/
├── frontend/                  ← Next.js 16 Frontend
│   ├── app/                   ← Next.js App Router
│   ├── components/            ← React Components
│   ├── lib/
│   │   ├── api.ts            ← API calls to Java backend
│   │   └── validations.ts    ← Zod validation schemas
│   ├── types/
│   │   └── index.ts          ← TypeScript types
│   ├── .env.local.example    ← Copy to .env.local
│   └── package.json
│
└── backend/                   ← Java Spring Boot Backend
    ├── src/main/java/com/inventory/
    │   ├── TilesSanitaryBackendApplication.java
    │   ├── controller/        ← REST endpoints
    │   ├── service/          ← Business logic
    │   ├── repository/       ← Database access
    │   ├── model/            ← JPA entities
    │   ├── dto/              ← Data transfer objects
    │   └── exception/        ← Error handling
    ├── src/main/resources/
    │   ├── application.yml   ← Database configuration
    │   ├── schema.sql        ← Database schema
    │   └── data.sql          ← Sample data
    └── pom.xml              ← Maven dependencies

```

## Backend Setup (Java Spring Boot)

### Prerequisites
- Java 17 or higher
- Maven 3.8+
- MySQL or PostgreSQL

### Installation Steps

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create database:**
   ```sql
   CREATE DATABASE tiles_sanitary_db;
   ```

3. **Configure database connection** in `src/main/resources/application.yml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/tiles_sanitary_db
       username: root
       password: your_password
     jpa:
       hibernate:
         ddl-auto: update
   ```

4. **Build the project:**
   ```bash
   mvn clean install
   ```

5. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```

   The backend will start on `http://localhost:8080`

### API Endpoints

**Stock Management:**
- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/{id}` - Get stock by ID
- `GET /api/stocks/search?q=keyword` - Search stocks
- `POST /api/stocks` - Create new stock
- `PUT /api/stocks/{id}` - Update stock
- `DELETE /api/stocks/{id}` - Delete stock
- `GET /api/stocks/low-stock` - Get low stock items

**Bill Management:**
- `GET /api/bills` - Get all bills
- `GET /api/bills/{id}` - Get bill by ID
- `GET /api/bills/search/by-number?billNumber=XXX` - Search by bill number
- `GET /api/bills/search?customerName=XXX&customerPhone=XXX` - Search by customer
- `POST /api/bills` - Create new bill
- `PUT /api/bills/{id}` - Update bill
- `DELETE /api/bills/{id}` - Delete bill
- `GET /api/bills/filter?startDate=XXX&endDate=XXX` - Filter by date range
- `GET /api/bills/check-number?billNumber=XXX` - Check if bill number exists

**Dashboard:**
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity?limit=5` - Get recent activity

## Frontend Setup (Next.js)

### Prerequisites
- Node.js 18+ and npm/yarn
- Backend running on localhost:8080

### Installation Steps

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

   Update `.env.local` if your backend is running on a different URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:3000`

## Features

### Stock Management
- View all stocks with real-time data from Java backend
- Search stocks by design name
- Add new stock items (design name, size, type, quantity, price)
- Edit existing stocks
- Delete stocks
- Low stock alerts

### Sales Management
- Create bills with customer information
- Search and add items to cart
- Adjust prices per item
- Automatic stock lookup when typing design name
- GST calculation (Exclusive/Inclusive)
- Discount options
- Validate duplicate bill numbers
- Edit and delete items in cart

### Bill Management
- View all bills and invoices
- Edit existing bills
- Search bills by customer name or phone
- Filter bills by date ranges (Today, Yesterday, Past Week, Month, 6 Months, Year, Custom)
- Print bills
- Download bills
- View bill details and edit them

### Dashboard
- Total items in stock
- Low stock alerts count
- Today's sales revenue
- Total revenue
- Recent activity feed
- Quick search functionality

## Troubleshooting

### Frontend can't connect to backend
- Ensure Java backend is running on `localhost:8080`
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Check browser console for CORS errors
- Backend CORS should be configured to accept requests from `localhost:3000`

### Database connection errors
- Verify database is running
- Check `application.yml` has correct credentials
- Ensure database schema is created (run `schema.sql`)

### Port already in use
- Backend: Change port in `application.yml` (default 8080)
- Frontend: Use `npm run dev -- -p 3001` for different port

## Development Workflow

1. Make changes to Java backend → Backend automatically reloads via Spring DevTools
2. Make changes to Next.js frontend → Frontend hot-reloads automatically
3. Both applications need to be running for full functionality

## Production Deployment

**Backend (Java):**
- Build JAR: `mvn clean package`
- Deploy to production server (AWS EC2, Heroku, etc.)
- Update frontend's `NEXT_PUBLIC_API_URL` environment variable

**Frontend (Next.js):**
- Build: `npm run build`
- Deploy to Vercel, Netlify, or your own server
- Set production API URL in environment variables

## Support

For issues or questions, please refer to:
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Next.js Documentation](https://nextjs.org/docs)
- [Java Documentation](https://docs.oracle.com/javase/)
