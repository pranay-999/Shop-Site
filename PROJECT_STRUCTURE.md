# Recommended Project Structure

## Current vs Recommended Structure

### ✅ **RECOMMENDED NEW STRUCTURE**

```
stock/
├── backend/                          # Spring Boot
│   ├── src/main/java/
│   │   └── com/inventory/
│   │       ├── config/              # New: Security, DB, Tenant configs
│   │       │   ├── SecurityConfig.java
│   │       │   ├── TenantAwareDataSource.java
│   │       │   └── JwtTokenProvider.java
│   │       │
│   │       ├── controller/          # Reorganized by domain
│   │       │   ├── auth/
│   │       │   │   └── AuthController.java
│   │       │   ├── tenant/
│   │       │   │   └── TenantController.java
│   │       │   ├── user/
│   │       │   │   └── UserController.java
│   │       │   ├── product/
│   │       │   │   ├── ProductController.java
│   │       │   │   └── CategoryController.java
│   │       │   ├── warehouse/
│   │       │   │   ├── WarehouseLocationController.java
│   │       │   │   └── InventoryController.java
│   │       │   ├── stock/
│   │       │   │   └── StockTransactionController.java
│   │       │   ├── customer/
│   │       │   │   └── CustomerController.java
│   │       │   ├── billing/
│   │       │   │   ├── BillController.java
│   │       │   │   └── BillItemController.java
│   │       │   └── report/
│   │       │       ├── SalesReportController.java
│   │       │       └── InventoryReportController.java
│   │       │
│   │       ├── service/             # Business logic
│   │       │   ├── auth/
│   │       │   │   ├── AuthService.java
│   │       │   │   └── JwtService.java
│   │       │   ├── tenant/
│   │       │   │   └── TenantService.java
│   │       │   ├── product/
│   │       │   │   ├── ProductService.java
│   │       │   │   └── CategoryService.java
│   │       │   ├── warehouse/
│   │       │   │   ├── WarehouseService.java
│   │       │   │   └── InventoryService.java
│   │       │   ├── billing/
│   │       │   │   ├── BillService.java
│   │       │   │   └── PrintService.java (for PDF generation)
│   │       │   ├── user/
│   │       │   │   └── UserService.java
│   │       │   └── report/
│   │       │       ├── SalesReportService.java
│   │       │       └── InventoryReportService.java
│   │       │
│   │       ├── entity/              # JPA Entities (renamed from model)
│   │       │   ├── Tenant.java
│   │       │   ├── User.java
│   │       │   ├── Product.java
│   │       │   ├── ProductCategory.java
│   │       │   ├── WarehouseLocation.java
│   │       │   ├── StockInventory.java
│   │       │   ├── StockTransaction.java
│   │       │   ├── Customer.java
│   │       │   ├── Bill.java
│   │       │   ├── BillItem.java
│   │       │   └── AuditLog.java
│   │       │
│   │       ├── dto/                 # Data Transfer Objects
│   │       │   ├── request/
│   │       │   │   ├── LoginRequest.java
│   │       │   │   ├── CreateProductRequest.java
│   │       │   │   ├── CreateBillRequest.java
│   │       │   │   └── ...
│   │       │   └── response/
│   │       │       ├── LoginResponse.java
│   │       │       ├── ProductResponse.java
│   │       │       ├── BillResponse.java
│   │       │       └── ...
│   │       │
│   │       ├── repository/          # Data access layer
│   │       │   ├── TenantRepository.java
│   │       │   ├── UserRepository.java
│   │       │   ├── ProductRepository.java
│   │       │   ├── WarehouseLocationRepository.java
│   │       │   ├── StockInventoryRepository.java
│   │       │   ├── BillRepository.java
│   │       │   ├── CustomerRepository.java
│   │       │   └── AuditLogRepository.java
│   │       │
│   │       ├── security/            # New: Security related
│   │       │   ├── JwtAuthenticationFilter.java
│   │       │   ├── TenantContext.java (for tenant isolation)
│   │       │   └── CustomUserDetails.java
│   │       │
│   │       ├── util/                # Utilities
│   │       │   ├── BillNumberGenerator.java
│   │       │   ├── PdfGenerator.java
│   │       │   └── DateUtils.java
│   │       │
│   │       ├── exception/           # Custom exceptions
│   │       │   ├── TenantNotFoundException.java
│   │       │   ├── UnauthorizedException.java
│   │       │   └── ResourceNotFoundException.java
│   │       │
│   │       └── InventoryApplication.java
│   │
│   ├── src/main/resources/
│   │   ├── application.yml          # Main config
│   │   ├── application-prod.yml     # Production
│   │   ├── application-dev.yml      # Development
│   │   ├── schema.sql               # Updated schema
│   │   ├── data.sql                 # Sample data
│   │   └── db/migration/            # Flyway/Liquibase migrations (for versioning)
│   │
│   ├── pom.xml
│   └── README.md
│
├── frontend/                        # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── add/
│   │   │   │   └── edit/[id]/
│   │   │   ├── warehouse/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── 3d-layout/       # New: 3D warehouse layout
│   │   │   │   │   └── page.tsx
│   │   │   │   └── locations/
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx
│   │   │   │   └── search/          # New: Search where items are
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── add/
│   │   │   │   └── edit/[id]/
│   │   │   ├── bills/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   ├── edit/[id]/
│   │   │   │   ├── view/[id]/
│   │   │   │   └── print/[id]/
│   │   │   ├── users/              # New: User management for admin
│   │   │   │   ├── page.tsx
│   │   │   │   ├── add/
│   │   │   │   └── edit/[id]/
│   │   │   ├── reports/
│   │   │   │   ├── sales/
│   │   │   │   ├── inventory/
│   │   │   │   └── user-performance/
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       ├── general/
│   │   │       └── categories/
│   │   │
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Home/Landing
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── navigation-header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── layout-wrapper.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── ProductForm.tsx
│   │   │   ├── BillForm.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── UserForm.tsx
│   │   │
│   │   ├── tables/
│   │   │   ├── ProductsTable.tsx
│   │   │   ├── BillsTable.tsx
│   │   │   ├── InventoryTable.tsx
│   │   │   └── UsersTable.tsx
│   │   │
│   │   ├── warehouse/             # New: 3D warehouse components
│   │   │   ├── Warehouse3D.tsx     # Three.js visualization
│   │   │   ├── LocationPicker.tsx
│   │   │   └── StockSearchWidget.tsx
│   │   │
│   │   ├── billing/
│   │   │   ├── BillPreview.tsx
│   │   │   ├── BillPrinter.tsx
│   │   │   └── BillCalculator.tsx
│   │   │
│   │   ├── ui/                    # Existing UI components (keep as is)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ... (all others)
│   │   │
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                  # API client
│   │   ├── auth.ts                 # Auth utilities
│   │   ├── validations.ts
│   │   ├── utils.ts
│   │   └── 3d-utils.ts             # New: 3D warehouse utilities
│   │
│   ├── hooks/
│   │   ├── use-auth.ts             # New: Auth hook
│   │   ├── use-tenant.ts           # New: Get current tenant
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── api.ts                  # API types
│   │   ├── auth.ts                 # Auth types
│   │   └── models.ts               # Domain models
│   │
│   ├── context/                    # New: React context
│   │   ├── AuthContext.tsx
│   │   ├── TenantContext.tsx
│   │   └── ToastContext.tsx
│   │
│   ├── middleware.ts               # Next.js middleware for auth
│   ├── tsconfig.json
│   ├── package.json
│   └── README.md
│
├── DATABASE_DESIGN.md              # New: Schema documentation
├── SETUP.md
├── ARCHITECTURE.md
├── API_DOCUMENTATION.md            # New: API endpoints doc
├── .env.example                    # New: Environment variables template
├── docker-compose.yml              # New: For local Supabase setup
└── README.md
```

---

## Key Changes Explained

### 1. **Backend Reorganization**
- **Old**: `model/`, `dto/`, `controller/`, `service/`, `repository/` all mixed
- **New**: Organized by **domain/feature** (auth, product, billing, warehouse)
- **Benefit**: Easier to navigate, better for team collaboration

### 2. **New Controllers/Services**
- `AuthController/Service` - Login, register, JWT
- `WarehouseLocationController/Service` - 3D coordinates, locations
- `StockTransactionController/Service` - Track stock movements
- `ReportController/Service` - Sales by user, inventory reports

### 3. **Frontend Reorganization**
- **New Auth Pages**: `/login`, `/register`
- **New Admin Pages**: `/users`, `/settings/categories`
- **New Warehouse Pages**: `/warehouse/3d-layout`, `/inventory/search`
- **New Reporting Pages**: `/reports/sales`, `/reports/user-performance`

### 4. **New Utilities**
- `BillNumberGenerator.java` - Consistent bill numbering with tenant prefix
- `PdfGenerator.java` - Generate printable bills
- `TenantContext.java` - Isolate data per tenant
- `JwtTokenProvider.java` - Secure authentication tokens

### 5. **New Files Needed**
- `API_DOCUMENTATION.md` - Document all API endpoints
- `.env.example` - Environment variables template
- `docker-compose.yml` - Easy local Supabase setup
- `db/migration/` folder - Database version control

---

## Migration Path (Step by Step)

### Phase 1: Database Setup (Week 1)
- [ ] Create new Supabase database
- [ ] Run schema.sql
- [ ] Migrate existing data

### Phase 2: Backend Foundation (Week 2-3)
- [ ] Add Spring Security + JWT
- [ ] Create Auth endpoints
- [ ] Create Tenant context
- [ ] Reorganize existing code into new structure

### Phase 3: Core Features (Week 4-6)
- [ ] Products & Categories
- [ ] Warehouse Locations (3D coords)
- [ ] Inventory Management
- [ ] Customers & Billing

### Phase 4: Advanced Features (Week 7-8)
- [ ] 3D Warehouse Visualization
- [ ] Stock Search by Location
- [ ] Reports & Analytics
- [ ] PDF Bill Generation

### Phase 5: Multi-Tenancy (Week 9-10)
- [ ] Complete tenant isolation
- [ ] Support multiple shops
- [ ] User permissions per shop

---

## Why This Structure?

| Aspect | Benefit |
|--------|---------|
| **Domain-Driven** | Easy to understand business logic |
| **Scalable** | Simple to add new features |
| **Multi-Tenant** | Support multiple shops from day 1 |
| **Maintainable** | Clear separation of concerns |
| **Testable** | Easy to unit test services |
| **Growth-Ready** | Built for 3D warehouse, analytics, reports |

