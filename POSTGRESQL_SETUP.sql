-- ============================================
-- CORRECTED SQL FOR POSTGRESQL (Supabase)
-- ============================================

-- Drop existing tables first
DROP TABLE IF EXISTS bill_items CASCADE;
DROP TABLE IF EXISTS bills CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;

-- ============================================
-- 1. CREATE PRODUCT CATEGORIES TABLE
-- ============================================
CREATE TABLE product_categories (
    id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    category_slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color_code VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CREATE STOCKS TABLE
-- ============================================
CREATE TABLE stocks (
    id BIGSERIAL PRIMARY KEY,
    design_name VARCHAR(255) NOT NULL,
    size VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    total_boxes INTEGER NOT NULL,
    price_per_box DOUBLE PRECISION NOT NULL,
    category_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE CASCADE,
    UNIQUE(design_name, category_id)
);

-- ============================================
-- 3. CREATE BILLS TABLE
-- ============================================
CREATE TABLE bills (
    id BIGSERIAL PRIMARY KEY,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    subtotal DOUBLE PRECISION NOT NULL,
    gst_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
    gst_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    gst_type VARCHAR(20) NOT NULL DEFAULT 'EXCLUSIVE',
    discount DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_amount DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. CREATE BILL ITEMS TABLE
-- ============================================
CREATE TABLE bill_items (
    id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    stock_id BIGINT NULL,
    design_name VARCHAR(255) NOT NULL,
    size VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    quantity_boxes INTEGER NOT NULL,
    price_per_box DOUBLE PRECISION NOT NULL,
    total_price DOUBLE PRECISION NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE SET NULL
);

-- ============================================
-- 5. CREATE INDEXES
-- ============================================
CREATE INDEX idx_stocks_design_name ON stocks(design_name);
CREATE INDEX idx_stocks_type ON stocks(type);
CREATE INDEX idx_stocks_category_id ON stocks(category_id);
CREATE INDEX idx_stocks_total_boxes ON stocks(total_boxes);
CREATE INDEX idx_bills_bill_number ON bills(bill_number);
CREATE INDEX idx_bills_customer_name ON bills(customer_name);
CREATE INDEX idx_bills_phone_number ON bills(phone_number);
CREATE INDEX idx_bills_created_at ON bills(created_at);
CREATE INDEX idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX idx_bill_items_stock_id ON bill_items(stock_id);

-- Optional compatibility view if your app expects `categories` table name
-- CREATE VIEW categories AS SELECT * FROM product_categories;

-- ============================================
-- 6. INSERT DEFAULT CATEGORIES
-- ============================================
INSERT INTO product_categories (category_name, category_slug, description, icon, color_code) VALUES
('Tiles', 'tiles', 'Ceramic, Porcelain, Marble, Granite tiles', 'square', '#3B82F6'),
('Electronics', 'electronics', 'Electronic items and appliances', 'lightbulb', '#F59E0B'),
('Sanitary Ware', 'sanitary-ware', 'Bathroom fixtures and sanitary products', 'droplet', '#10B981'),
('Faucets & Fixtures', 'faucets', 'Water faucets and bathroom fixtures', 'wrench', '#8B5CF6'),
('Hardware', 'hardware', 'Building hardware and accessories', 'hammer', '#EF4444'),
('Other', 'other', 'Miscellaneous products', 'cube', '#6B7280');

-- ============================================
-- 7. INSERT SAMPLE STOCK DATA
-- ============================================
INSERT INTO stocks (design_name, size, type, total_boxes, price_per_box, category_id) VALUES
-- Tiles Category (id = 1)
('Marble Tile A', '12x12', 'Ceramic', 150, 250.00, 1),
('Granite Tile B', '18x18', 'Natural Stone', 100, 450.00, 1),
('Porcelain White', '24x24', 'Porcelain', 200, 350.00, 1),

-- Sanitary Ware Category (id = 3)
('Bathtub Deluxe', 'Large', 'Acrylic', 20, 8500.00, 3),
('Toilet Seat Premium', 'Standard', 'Ceramic', 80, 3500.00, 3),
('Sink Basin Classic', 'Medium', 'Ceramic', 60, 2800.00, 3),

-- Faucets & Fixtures Category (id = 4)
('Sanitary Faucet S1', 'Standard', 'Brass', 45, 1200.00, 4),
('Shower Head Spray', 'Standard', 'Stainless Steel', 120, 850.00, 4);

-- ============================================
-- 8. INSERT SAMPLE BILL DATA
-- ============================================
INSERT INTO bills (bill_number, customer_name, phone_number, subtotal, gst_amount, gst_rate, gst_type, discount, total_amount) VALUES
('BILL-2024-001', 'Rajesh Kumar', '9876543210', 5000, 900, 18, 'EXCLUSIVE', 0, 5900),
('BILL-2024-002', 'Priya Sharma', '9988776655', 12000, 2160, 18, 'EXCLUSIVE', 500, 13660),
('BILL-2024-003', 'Amit Patel', '9123456789', 8500, 1530, 18, 'EXCLUSIVE', 0, 10030);

-- ============================================
-- 9. INSERT SAMPLE BILL ITEMS
-- ============================================
INSERT INTO bill_items (bill_id, stock_id, design_name, size, type, quantity_boxes, price_per_box, total_price) VALUES
(1, 1, 'Marble Tile A', '12x12', 'Ceramic', 10, 250, 2500),
(1, 7, 'Sanitary Faucet S1', 'Standard', 'Brass', 2, 1200, 2400),
(1, 8, 'Shower Head Spray', 'Standard', 'Stainless Steel', 1, 100, 100),
(2, 2, 'Granite Tile B', '18x18', 'Natural Stone', 20, 450, 9000),
(2, 3, 'Porcelain White', '24x24', 'Porcelain', 5, 350, 1750),
(2, 4, 'Bathtub Deluxe', 'Large', 'Acrylic', 1, 1250, 1250),
(3, 5, 'Toilet Seat Premium', 'Standard', 'Ceramic', 5, 350, 1750),
(3, 6, 'Sink Basin Classic', 'Medium', 'Ceramic', 3, 850, 2550),
(3, 8, 'Shower Head Spray', 'Standard', 'Stainless Steel', 4, 850, 3400);

-- ============================================
-- 10. VERIFY TABLES CREATED
-- ============================================
-- Run this to verify all tables exist:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;
