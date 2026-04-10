-- Sample Categories Data
INSERT INTO categories (id, category_name, category_slug, description, icon, color_code) VALUES
(1, 'Tiles', 'tiles', 'Ceramic, Porcelain, Marble, Granite tiles', 'square', '#3B82F6'),
(2, 'Electronics', 'electronics', 'Electronic items and appliances', 'lightbulb', '#F59E0B'),
(3, 'Sanitary Ware', 'sanitary-ware', 'Bathroom fixtures and sanitary products', 'droplet', '#10B981'),
(4, 'Faucets & Fixtures', 'faucets', 'Water faucets and bathroom fixtures', 'wrench', '#8B5CF6'),
(5, 'Hardware', 'hardware', 'Building hardware and accessories', 'hammer', '#EF4444'),
(6, 'Other', 'other', 'Miscellaneous products', 'cube', '#6B7280');

-- Sample Stock Data
INSERT INTO stocks (design_name, size, type, total_boxes, price_per_box, category_id, created_at, updated_at) VALUES
('Marble Tile A', '12x12', 'Ceramic', 150, 250.00, 1, NOW(), NOW()),
('Granite Tile B', '18x18', 'Natural Stone', 100, 450.00, 1, NOW(), NOW()),
('Porcelain White', '24x24', 'Porcelain', 200, 350.00, 1, NOW(), NOW()),
('Sanitary Faucet S1', 'Standard', 'Brass', 45, 1200.00, 4, NOW(), NOW()),
('Bathtub Deluxe', 'Large', 'Acrylic', 20, 8500.00, 3, NOW(), NOW()),
('Toilet Seat Premium', 'Standard', 'Ceramic', 80, 3500.00, 3, NOW(), NOW()),
('Sink Basin Classic', 'Medium', 'Ceramic', 60, 2800.00, 3, NOW(), NOW()),
('Shower Head Spray', 'Standard', 'Stainless Steel', 120, 850.00, 4, NOW(), NOW());

-- Sample Bill Data
INSERT INTO bills (bill_number, customer_name, phone_number, subtotal, gst_amount, gst_rate, gst_type, discount, total_amount, created_at, updated_at) VALUES
('BILL-2024-001', 'Rajesh Kumar', '9876543210', 5000, 900, 18, 'EXCLUSIVE', 0, 5900, NOW(), NOW()),
('BILL-2024-002', 'Priya Sharma', '9988776655', 12000, 2160, 18, 'EXCLUSIVE', 500, 13660, NOW(), NOW()),
('BILL-2024-003', 'Amit Patel', '9123456789', 8500, 1530, 18, 'EXCLUSIVE', 0, 10030, NOW(), NOW());

-- Sample Bill Items
INSERT INTO bill_items (bill_id, design_name, size, type, quantity_boxes, price_per_box, total_price) VALUES
(1, 'Marble Tile A', '12x12', 'Ceramic', 10, 250, 2500),
(1, 'Sanitary Faucet S1', 'Standard', 'Brass', 2, 1200, 2400),
(1, 'Shower Head Spray', 'Standard', 'Stainless Steel', 1, 100, 100),
(2, 'Granite Tile B', '18x18', 'Natural Stone', 20, 450, 9000),
(2, 'Porcelain White', '24x24', 'Porcelain', 5, 350, 1750),
(2, 'Bathtub Deluxe', 'Large', 'Acrylic', 1, 1250, 1250),
(3, 'Toilet Seat Premium', 'Standard', 'Ceramic', 5, 350, 1750),
(3, 'Sink Basin Classic', 'Medium', 'Ceramic', 3, 850, 2550),
(3, 'Shower Head Spray', 'Standard', 'Stainless Steel', 4, 850, 3400);
