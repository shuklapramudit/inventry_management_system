USE chashma_plus_inventory_new;

-- =====================================================
-- SEED DATA
-- CHASHMA PLUS INVENTORY MANAGEMENT SYSTEM
-- =====================================================


-- =====================================================
-- 1. LENS TYPES
-- =====================================================

INSERT IGNORE INTO lens_types
(
    name,
    description
)
VALUES
(
    'Single Vision',
    'Single vision prescription lens'
),
(
    'Bifocal',
    'Bifocal prescription lens'
),
(
    'Progressive',
    'Progressive prescription lens'
),
(
    'Blue Cut',
    'Blue light filtering lens'
),
(
    'Photochromic',
    'Light adaptive photochromic lens'
);


-- =====================================================
-- 2. DEMO CUSTOMERS
-- =====================================================

INSERT IGNORE INTO customers
(
    name,
    mobile
)
VALUES
(
    'Rahul Sharma',
    '9876543210'
),
(
    'Amit Verma',
    '9876543211'
),
(
    'Priya Singh',
    '9876543212'
),
(
    'Neha Gupta',
    '9876543213'
);


-- =====================================================
-- 3. DEMO PRODUCTS
-- =====================================================

INSERT INTO products
(
    product_type,
    product_name,
    product_image,
    shop_location,
    description,
    is_active
)
SELECT
    'Frame',
    'Classic Black Full Rim',
    NULL,
    'Arjunganj',
    'Classic black full rim optical frame',
    TRUE
WHERE NOT EXISTS
(
    SELECT 1
    FROM products
    WHERE product_name = 'Classic Black Full Rim'
);


INSERT INTO products
(
    product_type,
    product_name,
    product_image,
    shop_location,
    description,
    is_active
)
SELECT
    'Frame',
    'Metal Silver Frame',
    NULL,
    'Telibag',
    'Lightweight silver metal optical frame',
    TRUE
WHERE NOT EXISTS
(
    SELECT 1
    FROM products
    WHERE product_name = 'Metal Silver Frame'
);


INSERT INTO products
(
    product_type,
    product_name,
    product_image,
    shop_location,
    description,
    is_active
)
SELECT
    'Frame',
    'Premium Blue Frame',
    NULL,
    'Arjunganj',
    'Premium blue optical frame',
    TRUE
WHERE NOT EXISTS
(
    SELECT 1
    FROM products
    WHERE product_name = 'Premium Blue Frame'
);


INSERT INTO products
(
    product_type,
    product_name,
    product_image,
    shop_location,
    description,
    is_active
)
SELECT
    'Sunglass',
    'Classic Black Sunglass',
    NULL,
    'Telibag',
    'Classic black UV protection sunglasses',
    TRUE
WHERE NOT EXISTS
(
    SELECT 1
    FROM products
    WHERE product_name = 'Classic Black Sunglass'
);


INSERT INTO products
(
    product_type,
    product_name,
    product_image,
    shop_location,
    description,
    is_active
)
SELECT
    'Sunglass',
    'Brown Premium Sunglass',
    NULL,
    'Arjunganj',
    'Premium brown sunglasses',
    TRUE
WHERE NOT EXISTS
(
    SELECT 1
    FROM products
    WHERE product_name = 'Brown Premium Sunglass'
);


-- =====================================================
-- 4. CREATE INVENTORY FOR PRODUCTS
-- =====================================================

INSERT INTO inventory
(
    product_id,
    purchased_quantity,
    sold_quantity,
    current_stock,
    low_stock_limit
)
SELECT
    p.id,
    CASE
        WHEN p.product_type = 'Frame' THEN 10
        ELSE 8
    END,
    0,
    CASE
        WHEN p.product_type = 'Frame' THEN 10
        ELSE 8
    END,
    3
FROM products p
WHERE NOT EXISTS
(
    SELECT 1
    FROM inventory i
    WHERE i.product_id = p.id
);


-- =====================================================
-- 5. PURCHASE HISTORY
-- =====================================================

INSERT INTO purchases
(
    product_id,
    quantity,
    purchase_price,
    shop_location,
    purchase_date,
    notes
)
SELECT
    p.id,

    CASE
        WHEN p.product_type = 'Frame' THEN 10
        ELSE 8
    END,

    CASE
        WHEN p.product_type = 'Frame' THEN 500.00
        ELSE 700.00
    END,

    p.shop_location,

    CURRENT_TIMESTAMP,

    'Initial stock seeded for Chashma Plus'
FROM products p
WHERE NOT EXISTS
(
    SELECT 1
    FROM purchases pu
    WHERE
        pu.product_id = p.id
        AND pu.notes =
            'Initial stock seeded for Chashma Plus'
);


-- =====================================================
-- 6. INVENTORY MOVEMENTS
-- =====================================================

INSERT INTO inventory_movements
(
    product_id,
    movement_type,
    quantity,
    reference_id,
    reference_type,
    notes
)
SELECT
    p.id,

    'PURCHASE',

    CASE
        WHEN p.product_type = 'Frame' THEN 10
        ELSE 8
    END,

    NULL,

    'SEED',

    'Initial inventory seeded for Chashma Plus'
FROM products p
WHERE NOT EXISTS
(
    SELECT 1
    FROM inventory_movements im
    WHERE
        im.product_id = p.id
        AND im.reference_type = 'SEED'
);


-- =====================================================
-- FINAL CHECK
-- =====================================================

SELECT
    'Customers' AS table_name,
    COUNT(*) AS total
FROM customers

UNION ALL

SELECT
    'Products',
    COUNT(*)
FROM products

UNION ALL

SELECT
    'Inventory',
    COUNT(*)
FROM inventory

UNION ALL

SELECT
    'Purchases',
    COUNT(*)
FROM purchases

UNION ALL

SELECT
    'Lens Types',
    COUNT(*)
FROM lens_types;