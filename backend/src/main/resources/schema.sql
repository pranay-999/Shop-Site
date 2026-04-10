-- Create Database
CREATE DATABASE IF NOT EXISTS tiles_sanitary_db;
USE tiles_sanitary_db;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_slug VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    icon VARCHAR(50),
    color_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stocks Table
CREATE TABLE IF NOT EXISTS stocks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    design_name VARCHAR(255) NOT NULL,
    size VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    total_boxes INT NOT NULL,
    price_per_box DOUBLE NOT NULL,
    category_id BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_design_name (design_name),
    KEY idx_design_name (design_name),
    KEY idx_type (type),
    KEY idx_category_id (category_id),
    CONSTRAINT fk_stocks_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    subtotal DOUBLE NOT NULL,
    gst_amount DOUBLE NOT NULL DEFAULT 0,
    gst_rate DOUBLE NOT NULL DEFAULT 0,
    gst_type VARCHAR(20) NOT NULL DEFAULT 'EXCLUSIVE',
    discount DOUBLE NOT NULL DEFAULT 0,
    total_amount DOUBLE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_bill_number (bill_number),
    KEY idx_bill_number (bill_number),
    KEY idx_customer_name (customer_name),
    KEY idx_phone_number (phone_number),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bill Items Table
CREATE TABLE IF NOT EXISTS bill_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    bill_id BIGINT NOT NULL,
    design_name VARCHAR(255) NOT NULL,
    size VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    quantity_boxes INT NOT NULL,
    price_per_box DOUBLE NOT NULL,
    total_price DOUBLE NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    KEY idx_bill_id (bill_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Indexes for better performance
CREATE INDEX idx_stocks_total_boxes ON stocks(total_boxes);
CREATE INDEX idx_bills_date_range ON bills(created_at);
