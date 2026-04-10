# Multi-Tenant Database Design for Inventory Management System

## Overview
This is a **multi-tenant, multi-shop, multi-product category** system designed to:
- Support multiple shops (Tiles, Electronics, Groceries, etc.)
- Track inventory in warehouse locations (3D layout)
- Manage multiple users per shop with role-based access
- Generate bills and track sales per user
- Scale horizontally for different business types

---

## Database Schema

### 1. **Tenants (Shop Information)**
```sql
CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,
    tenant_name VARCHAR(255) NOT NULL UNIQUE,
    tenant_slug VARCHAR(100) NOT NULL UNIQUE, -- 'tiles-shop', 'electronics-hub'
    business_type VARCHAR(50) NOT NULL, -- 'tiles', 'electronics', 'grocery'
    subscription_tier VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example:
-- (1, 'Raj Tiles Store', 'raj-tiles', 'tiles', 'pro', true, ...)
-- (2, 'Tech Electronics', 'tech-electronics', 'electronics', 'pro', true, ...)
```

### 2. **Users (Shop Employees)**
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'salesman', -- admin, manager, salesman, warehouse_staff
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, email),
    UNIQUE (tenant_id, username)
);

-- Example:
-- (1, 1, 'rajesh', 'rajesh@raj-tiles.com', '$2a$10$...', 'Rajesh Kumar', '9876543210', 'admin', true, ...)
-- (2, 1, 'priya', 'priya@raj-tiles.com', '$2a$10$...', 'Priya Sharma', '9988776655', 'salesman', true, ...)
```

### 3. **Product Categories**
```sql
CREATE TABLE product_categories (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    category_name VARCHAR(255) NOT NULL, -- 'Tiles', 'Sanitary', 'Faucets'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, category_name)
);

-- Example (for tiles shop):
-- (1, 1, 'Ceramic Tiles', '...', true, ...)
-- (2, 1, 'Sanitary Ware', '...', true, ...)
-- (3, 1, 'Faucets', '...', true, ...)
```

### 4. **Products (Actual Items - Design Variants)**
```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL, -- 'Marble Tile A'
    sku VARCHAR(100) NOT NULL,
    description TEXT,
    size VARCHAR(100), -- '12x12', 'Standard', 'Large'
    type VARCHAR(100), -- 'Ceramic', 'Brass', 'Acrylic'
    base_price DOUBLE PRECISION NOT NULL,
    unit_of_measure VARCHAR(50) DEFAULT 'boxes', -- 'boxes', 'pieces', 'kg'
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, sku)
);

-- Example:
-- (1, 1, 1, 'Marble Tile A', 'MT-A-12x12', 'Premium marble', '12x12', 'Ceramic', 250.00, 'boxes', null, true, ...)
-- (2, 1, 1, 'Granite Tile B', 'GT-B-18x18', 'Natural stone', '18x18', 'Natural Stone', 450.00, 'boxes', null, true, ...)
```

### 5. **Warehouse Locations (3D Layout Support)**
```sql
CREATE TABLE warehouse_locations (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    location_code VARCHAR(100) NOT NULL, -- 'A-1-1', 'B-2-3' (Aisle-Rack-Shelf)
    aisle_number INT, -- For 3D: which aisle (X axis)
    rack_number INT, -- For 3D: which rack (Y axis)
    shelf_level INT, -- For 3D: which level (Z axis - height)
    capacity_boxes INT, -- Max boxes that can fit
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, location_code)
);

-- Example:
-- (1, 1, 'A-1-1', 1, 1, 1, 50, true, ...)
-- (2, 1, 'A-1-2', 1, 1, 2, 50, true, ...)
-- (3, 1, 'B-2-3', 2, 2, 3, 40, true, ...)
```

### 6. **Stock/Inventory (Real-time Tracking)**
```sql
CREATE TABLE stock_inventory (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_level INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, product_id, location_id)
);

-- Example:
-- (1, 1, 1, 1, 50, 20, ...)  -- Marble Tile A at location A-1-1: 50 boxes
-- (2, 1, 2, 2, 100, 20, ...) -- Granite Tile B at location A-1-2: 100 boxes
```

### 7. **Stock Transactions (History/Audit Trail)**
```sql
CREATE TABLE stock_transactions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT'
    quantity_change INT NOT NULL,
    notes TEXT,
    created_by BIGINT NOT NULL, -- user_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 8. **Customers**
```sql
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, phone_number)
);

-- Example:
-- (1, 1, 'Rajesh Kumar', '9876543210', 'rajesh@email.com', '...', '18AAJCT5055K1Z0', ...)
```

### 9. **Bills (Order Header)**
```sql
CREATE TABLE bills (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    bill_number VARCHAR(50) NOT NULL,
    customer_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL, -- salesman user_id
    bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DOUBLE PRECISION NOT NULL,
    gst_rate DOUBLE PRECISION DEFAULT 18,
    gst_type VARCHAR(20) DEFAULT 'EXCLUSIVE', -- 'INCLUSIVE', 'EXCLUSIVE'
    gst_amount DOUBLE PRECISION,
    discount_type VARCHAR(50) DEFAULT 'FIXED', -- 'FIXED', 'PERCENTAGE'
    discount_value DOUBLE PRECISION DEFAULT 0,
    total_amount DOUBLE PRECISION NOT NULL,
    bill_status VARCHAR(50) DEFAULT 'completed', -- 'draft', 'completed', 'cancelled'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE (tenant_id, bill_number)
);

-- Example:
-- (1, 1, 'BILL-2024-001', 1, 1, 2024-01-15, 5000, 18, 'EXCLUSIVE', 900, 'FIXED', 0, 5900, 'completed', null, ...)
```

### 10. **Bill Items (Order Line Items)**
```sql
CREATE TABLE bill_items (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    bill_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL, -- Track which location item came from
    quantity DOUBLE PRECISION NOT NULL,
    unit_price DOUBLE PRECISION NOT NULL,
    total_price DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (location_id) REFERENCES warehouse_locations(id)
);

-- Example:
-- (1, 1, 1, 1, 1, 10, 250, 2500, ...)  -- 10 boxes of Marble Tile A from location A-1-1
```

### 11. **Audit Log (Who did what)**
```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    action VARCHAR(255) NOT NULL, -- 'bill_created', 'stock_updated', 'user_login'
    entity_type VARCHAR(100), -- 'bill', 'stock', 'user'
    entity_id BIGINT,
    changes_json TEXT, -- JSON of what changed
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Database Design Benefits

### ✅ Multi-Tenancy
- Separate data per shop completely
- Each shop can have different products/categories
- No data leakage between shops

### ✅ User Management & Tracking
- Know who created/modified each transaction
- Role-based access control (admin, manager, salesman)
- Multiple users per shop

### ✅ Real-Time Warehouse Inventory
- Track stock at **specific locations** (aisle, rack, shelf)
- 3D coordinates ready for visualization
- Quick search: "Where is Marble Tile A?" → Returns location code + quantity

### ✅ Audit Trail
- Complete history of all changes
- Track who did what, when
- For compliance and debugging

### ✅ Scalable for Any Shop Type
- Product categories are flexible
- SKU-based approach (tiles, electronics, groceries all use same schema)
- Only product names and categories change

---

## SQL to Create Fresh Database

```sql
-- Drop existing tables (caution!)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS bill_items CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS stock_inventory CASCADE;
DROP TABLE IF EXISTS warehouse_locations CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Create tables
CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,
    tenant_name VARCHAR(255) NOT NULL UNIQUE,
    tenant_slug VARCHAR(100) NOT NULL UNIQUE,
    business_type VARCHAR(50) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'basic',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'salesman',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, email),
    UNIQUE (tenant_id, username)
);

CREATE TABLE product_categories (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, category_name)
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    description TEXT,
    size VARCHAR(100),
    type VARCHAR(100),
    base_price DOUBLE PRECISION NOT NULL,
    unit_of_measure VARCHAR(50) DEFAULT 'boxes',
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, sku)
);

CREATE TABLE warehouse_locations (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    location_code VARCHAR(100) NOT NULL,
    aisle_number INT,
    rack_number INT,
    shelf_level INT,
    capacity_boxes INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, location_code)
);

CREATE TABLE stock_inventory (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_level INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, product_id, location_id)
);

CREATE TABLE stock_transactions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    quantity_change INT NOT NULL,
    notes TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, phone_number)
);

CREATE TABLE bills (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    bill_number VARCHAR(50) NOT NULL,
    customer_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DOUBLE PRECISION NOT NULL,
    gst_rate DOUBLE PRECISION DEFAULT 18,
    gst_type VARCHAR(20) DEFAULT 'EXCLUSIVE',
    gst_amount DOUBLE PRECISION,
    discount_type VARCHAR(50) DEFAULT 'FIXED',
    discount_value DOUBLE PRECISION DEFAULT 0,
    total_amount DOUBLE PRECISION NOT NULL,
    bill_status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE (tenant_id, bill_number)
);

CREATE TABLE bill_items (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    bill_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    location_id BIGINT NOT NULL,
    quantity DOUBLE PRECISION NOT NULL,
    unit_price DOUBLE PRECISION NOT NULL,
    total_price DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (location_id) REFERENCES warehouse_locations(id)
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    changes_json TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_stock_inventory_tenant ON stock_inventory(tenant_id, product_id);
CREATE INDEX idx_stock_inventory_location ON stock_inventory(location_id);
CREATE INDEX idx_bills_tenant ON bills(tenant_id, bill_date);
CREATE INDEX idx_bills_created_by ON bills(created_by);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at);

-- Sample data
INSERT INTO tenants (tenant_name, tenant_slug, business_type, subscription_tier) 
VALUES ('Raj Tiles Store', 'raj-tiles', 'tiles', 'pro');

INSERT INTO users (tenant_id, username, email, password_hash, full_name, phone, role) 
VALUES (1, 'rajesh', 'rajesh@raj-tiles.com', 'hashed_password_here', 'Rajesh Kumar', '9876543210', 'admin');

-- More data to follow in separate files...
```

