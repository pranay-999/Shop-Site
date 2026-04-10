# Tiles & Sanitary Stock Management Backend

A Spring Boot REST API backend for managing tiles and sanitary product inventory, sales, and billing.

## Prerequisites

- Java 17 or higher
- Maven 3.8.0 or higher
- MySQL 8.0 or PostgreSQL 12+
- Git

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/inventory/
│   │   │   ├── model/               # JPA Entities
│   │   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── repository/          # Spring Data JPA Repositories
│   │   │   ├── service/             # Business Logic Services
│   │   │   ├── controller/          # REST API Controllers
│   │   │   └── TilesSanitaryBackendApplication.java
│   │   └── resources/
│   │       ├── application.yml      # Application Configuration
│   │       └── schema.sql           # Database Schema
│   └── test/
├── pom.xml                          # Maven Dependencies
└── README.md
```

## Setup Instructions

### 1. Clone the Repository
```bash
cd backend
```

### 2. Configure Database

#### For MySQL:
1. Create a MySQL database:
```sql
CREATE DATABASE tiles_sanitary_db;
```

2. Update `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/tiles_sanitary_db?useSSL=false&serverTimezone=UTC
    username: root
    password: your_password
```

#### For PostgreSQL:
1. Create a PostgreSQL database:
```sql
CREATE DATABASE tiles_sanitary_db;
```

2. Update `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/tiles_sanitary_db
    username: postgres
    password: your_password
    driver-class-name: org.postgresql.Driver
  jpa:
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

### 3. Build the Project
```bash
mvn clean install
```

### 4. Run the Application
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080/api`

## API Endpoints

### Stock Management

- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/{id}` - Get stock by ID
- `GET /api/stocks/design/{designName}` - Get stock by design name
- `GET /api/stocks/search?q=query` - Search stocks
- `GET /api/stocks/low-stock?threshold=10` - Get low stock items
- `POST /api/stocks` - Create new stock
- `PUT /api/stocks/{id}` - Update stock
- `DELETE /api/stocks/{id}` - Delete stock
- `GET /api/stocks/stats/total` - Get total stock count
- `GET /api/stocks/stats/low-count?threshold=10` - Get low stock count

### Bill Management

- `GET /api/bills` - Get all bills
- `GET /api/bills/{id}` - Get bill by ID
- `GET /api/bills/number/{billNumber}` - Get bill by bill number
- `GET /api/bills/search?q=query` - Search bills
- `GET /api/bills/customer/{customerName}` - Search by customer name
- `GET /api/bills/phone/{phoneNumber}` - Search by phone number
- `POST /api/bills` - Create new bill
- `PUT /api/bills/{billNumber}` - Update bill
- `DELETE /api/bills/{billNumber}` - Delete bill
- `POST /api/bills/check-bill-number` - Check if bill number exists
- `GET /api/bills/filter/today` - Get today's bills
- `GET /api/bills/filter/past-week` - Get past week bills
- `GET /api/bills/filter/past-month` - Get past month bills
- `GET /api/bills/filter/past-six-months` - Get past 6 months bills
- `GET /api/bills/filter/past-year` - Get past year bills
- `POST /api/bills/filter/date-range` - Get bills by date range
- `GET /api/bills/stats/total` - Get total bill count
- `GET /api/bills/stats/today-revenue` - Get today's revenue

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/low-stock?threshold=10` - Get low stock information

## Request/Response Examples

### Create Stock
```bash
curl -X POST http://localhost:8080/api/stocks \
  -H "Content-Type: application/json" \
  -d '{
    "designName": "Marble Tile A",
    "size": "12x12",
    "type": "Ceramic",
    "totalBoxes": 100,
    "pricePerBox": 250.00
  }'
```

### Create Bill
```bash
curl -X POST http://localhost:8080/api/bills \
  -H "Content-Type: application/json" \
  -d '{
    "billNumber": "BILL-001",
    "customerName": "John Doe",
    "phoneNumber": "9876543210",
    "subtotal": 5000,
    "gstAmount": 900,
    "gstRate": 18,
    "gstType": "EXCLUSIVE",
    "discount": 0,
    "totalAmount": 5900,
    "items": [
      {
        "designName": "Marble Tile A",
        "size": "12x12",
        "type": "Ceramic",
        "quantityBoxes": 10,
        "pricePerBox": 250,
        "totalPrice": 2500
      }
    ]
  }'
```

## Frontend Integration

Update your Next.js frontend API base URL in the environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Then update your API calls:
```javascript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stocks`);
```

## Technologies Used

- **Spring Boot 3.2.0** - Web Framework
- **Spring Data JPA** - ORM
- **MySQL/PostgreSQL** - Database
- **Lombok** - Code Generation
- **Maven** - Build Tool

## Database Schema

### Stocks Table
- `id` - Primary Key
- `design_name` - Product design name
- `size` - Product size
- `type` - Product type
- `total_boxes` - Number of boxes available
- `price_per_box` - Price per box
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### Bills Table
- `id` - Primary Key
- `bill_number` - Unique bill identifier
- `customer_name` - Customer name
- `phone_number` - Customer phone
- `subtotal` - Bill subtotal
- `gst_amount` - GST amount
- `gst_rate` - GST rate
- `gst_type` - EXCLUSIVE or INCLUSIVE
- `discount` - Discount amount
- `total_amount` - Final total
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### Bill Items Table
- `id` - Primary Key
- `bill_id` - Foreign Key to Bills
- `design_name` - Product design name
- `size` - Product size
- `type` - Product type
- `quantity_boxes` - Number of boxes sold
- `price_per_box` - Price per box
- `total_price` - Total price for this item

## Error Handling

The API returns appropriate HTTP status codes:
- `200 OK` - Successful GET/PUT request
- `201 CREATED` - Successful POST request
- `204 NO CONTENT` - Successful DELETE request
- `400 BAD REQUEST` - Invalid request data
- `404 NOT FOUND` - Resource not found
- `500 INTERNAL SERVER ERROR` - Server error

## CORS Configuration

CORS is enabled for:
- `http://localhost:3000` (Vercel/v0 preview)
- `http://localhost:5173` (Vite development)

Modify in `TilesSanitaryBackendApplication.java` for production URLs.

## Running Tests

```bash
mvn test
```

## Building for Production

```bash
mvn clean package -DskipTests
java -jar target/tiles-sanitary-backend-1.0.0.jar
```

## Deployment

The backend can be deployed to:
- AWS Elastic Beanstalk
- Heroku
- DigitalOcean App Platform
- Any Java-compatible hosting

## Support

For issues or questions, please check the application logs or create an issue in the repository.

## License

This project is licensed under the MIT License.
