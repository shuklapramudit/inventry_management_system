-- ============================================================
-- CHASHMA PLUS INVENTORY MANAGEMENT SYSTEM
-- DATABASE SCHEMA
-- MySQL / Aiven MySQL Compatible
-- ============================================================

USE chashma_plus_inventory_new;

-- ============================================================
-- 1. ADMINS
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL DEFAULT 'Administrator',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. CUSTOMERS
-- Only:
-- Name
-- Mobile Number
-- Date & Time
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_customer_name (name),
    INDEX idx_customer_mobile (mobile),
    INDEX idx_customer_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. PRODUCTS
--
-- Product ID = Auto Increment
-- Product Type = Frame / Sunglass
-- Product Name
-- Product Image
-- Shop Location = Arjunganj / Telibag
-- Description
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_type ENUM('Frame', 'Sunglass') NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_image VARCHAR(500) DEFAULT NULL,
    shop_location ENUM('Arjunganj', 'Telibag') NOT NULL,
    description TEXT DEFAULT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_product_type (product_type),
    INDEX idx_product_name (product_name),
    INDEX idx_product_location (shop_location),
    INDEX idx_product_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. INVENTORY
--
-- One inventory record for each product.
--
-- purchased_quantity = Total purchased
-- sold_quantity      = Total sold
-- current_stock      = Available stock
-- low_stock_limit    = Alert threshold
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id INT UNSIGNED NOT NULL,

    purchased_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    sold_quantity INT UNSIGNED NOT NULL DEFAULT 0,
    current_stock INT NOT NULL DEFAULT 0,

    low_stock_limit INT UNSIGNED NOT NULL DEFAULT 5,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_inventory_product (product_id),

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_inventory_stock (current_stock),
    INDEX idx_inventory_low_stock (low_stock_limit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. PURCHASES
--
-- Keeps purchase history.
--
-- Dashboard can use this table to show purchased items
-- by month/year.
-- ============================================================

CREATE TABLE IF NOT EXISTS purchases (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id INT UNSIGNED NOT NULL,

    quantity INT UNSIGNED NOT NULL,
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    shop_location ENUM('Arjunganj', 'Telibag') NOT NULL,

    purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    notes VARCHAR(500) DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_purchase_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_purchase_product (product_id),
    INDEX idx_purchase_date (purchase_date),
    INDEX idx_purchase_location (shop_location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. LENS TYPES
--
-- Dynamic lens types.
--
-- Example:
-- Single Vision
-- Bifocal
-- Progressive
-- Blue Cut
-- Photochromic
-- ============================================================

CREATE TABLE IF NOT EXISTS lens_types (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,

    name VARCHAR(150) NOT NULL,
    description VARCHAR(500) DEFAULT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_lens_type_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. EYE TESTS
--
-- RIGHT EYE:
-- SPH
-- CYL
-- Axis
-- ADD
-- PD
--
-- LEFT EYE:
-- SPH
-- CYL
-- Axis
-- ADD
-- PD
--
-- Lens Type
-- Lens Price
-- Frame
-- Frame Price
-- ============================================================

CREATE TABLE IF NOT EXISTS eye_tests (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    customer_id INT UNSIGNED NOT NULL,

    -- RIGHT EYE
    right_sph DECIMAL(5,2) DEFAULT NULL,
    right_cyl DECIMAL(5,2) DEFAULT NULL,
    right_axis DECIMAL(6,2) DEFAULT NULL,
    right_add DECIMAL(5,2) DEFAULT NULL,
    right_pd DECIMAL(5,2) DEFAULT NULL,

    -- LEFT EYE
    left_sph DECIMAL(5,2) DEFAULT NULL,
    left_cyl DECIMAL(5,2) DEFAULT NULL,
    left_axis DECIMAL(6,2) DEFAULT NULL,
    left_add DECIMAL(5,2) DEFAULT NULL,
    left_pd DECIMAL(5,2) DEFAULT NULL,

    -- LENS
    lens_type_id INT UNSIGNED DEFAULT NULL,
    lens_type_name VARCHAR(150) DEFAULT NULL,
    lens_price DECIMAL(12,2) DEFAULT 0.00,

    -- FRAME
    frame_product_id INT UNSIGNED DEFAULT NULL,
    frame_name VARCHAR(200) DEFAULT NULL,
    frame_price DECIMAL(12,2) DEFAULT 0.00,

    test_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    notes TEXT DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_eye_test_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_eye_test_lens_type
        FOREIGN KEY (lens_type_id)
        REFERENCES lens_types(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_eye_test_frame
        FOREIGN KEY (frame_product_id)
        REFERENCES products(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_eye_test_customer (customer_id),
    INDEX idx_eye_test_date (test_date),
    INDEX idx_eye_test_lens (lens_type_id),
    INDEX idx_eye_test_frame (frame_product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. SALES
--
-- One sale belongs to one customer.
--
-- Contains:
-- Lens
-- Frame
-- Discount
-- GST
-- Final Total
-- ============================================================

CREATE TABLE IF NOT EXISTS sales (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    customer_id INT UNSIGNED NOT NULL,
    eye_test_id BIGINT UNSIGNED DEFAULT NULL,

    -- LENS
    lens_type_id INT UNSIGNED DEFAULT NULL,
    lens_name VARCHAR(150) DEFAULT NULL,
    lens_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    -- FRAME
    frame_product_id INT UNSIGNED DEFAULT NULL,
    frame_name VARCHAR(200) DEFAULT NULL,
    frame_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    -- AMOUNTS
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    -- DISCOUNT
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    -- GST
    gst_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    gst_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    -- FINAL
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    notes VARCHAR(500) DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_sale_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_sale_eye_test
        FOREIGN KEY (eye_test_id)
        REFERENCES eye_tests(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_sale_lens_type
        FOREIGN KEY (lens_type_id)
        REFERENCES lens_types(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_sale_frame
        FOREIGN KEY (frame_product_id)
        REFERENCES products(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_sale_customer (customer_id),
    INDEX idx_sale_date (sale_date),
    INDEX idx_sale_frame (frame_product_id),
    INDEX idx_sale_lens (lens_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. SALE PAYMENTS
--
-- Payment feature is kept ready.
-- Actual payment gateway can be integrated later.
-- ============================================================

CREATE TABLE IF NOT EXISTS sale_payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    sale_id BIGINT UNSIGNED NOT NULL,

    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    payment_method ENUM(
        'Cash',
        'UPI',
        'Card',
        'Online',
        'Pending'
    ) NOT NULL DEFAULT 'Pending',

    payment_status ENUM(
        'Pending',
        'Paid',
        'Partial',
        'Failed',
        'Refunded'
    ) NOT NULL DEFAULT 'Pending',

    transaction_id VARCHAR(200) DEFAULT NULL,

    payment_date DATETIME DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_payment_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_payment_sale (sale_id),
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. INVENTORY MOVEMENTS
--
-- Every stock IN / OUT can be tracked.
--
-- PURCHASE = Stock increases
-- SALE     = Stock decreases
-- ADJUSTMENT = Manual adjustment
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_movements (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    product_id INT UNSIGNED NOT NULL,

    movement_type ENUM(
        'PURCHASE',
        'SALE',
        'ADJUSTMENT'
    ) NOT NULL,

    quantity INT NOT NULL,

    reference_id BIGINT UNSIGNED DEFAULT NULL,

    reference_type VARCHAR(50) DEFAULT NULL,

    notes VARCHAR(500) DEFAULT NULL,

    movement_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT fk_inventory_movement_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    INDEX idx_movement_product (product_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_movement_date (movement_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 11. DEFAULT LENS TYPES
-- ============================================================

INSERT IGNORE INTO lens_types
    (name, description)
VALUES
    ('Single Vision', 'Single vision prescription lens'),
    ('Bifocal', 'Bifocal prescription lens'),
    ('Progressive', 'Progressive prescription lens'),
    ('Blue Cut', 'Blue light filtering lens'),
    ('Photochromic', 'Light adaptive photochromic lens');


-- ============================================================
-- END OF SCHEMA
-- ============================================================