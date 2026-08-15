import db from "../config/db.js";

// =====================================================
// SALES SERVICE
// =====================================================


// =====================================================
// GET CUSTOMERS
// =====================================================

export const getSalesCustomersService = async () => {
  const [customers] = await db.query(`
    SELECT
      id,
      name,
      mobile
    FROM customers
    ORDER BY name ASC
  `);

  return customers;
};


// =====================================================
// GET CUSTOMER SALES INFORMATION
// =====================================================

export const getCustomerSalesInfoService = async (
  customerId
) => {

  const [customers] = await db.query(
    `
    SELECT
      id,
      name,
      mobile,
      email,
      address,
      city,
      state,
      pincode
    FROM customers
    WHERE id = ?
    LIMIT 1
    `,
    [customerId]
  );

  if (customers.length === 0) {
    return null;
  }

  const [eyeTests] = await db.query(
    `
    SELECT
      et.id,
      et.customer_id,

      et.right_sph,
      et.right_cyl,
      et.right_axis,
      et.right_add,
      et.right_pd,

      et.left_sph,
      et.left_cyl,
      et.left_axis,
      et.left_add,
      et.left_pd,

      et.lens_type_id,

      COALESCE(
        lt.name,
        et.lens_type_name
      ) AS lens_type,

      et.lens_price,

      et.frame_product_id,
      et.frame_name,
      et.frame_price,

      et.test_date

    FROM eye_tests et

    LEFT JOIN lens_types lt
      ON et.lens_type_id = lt.id

    WHERE et.customer_id = ?

    ORDER BY
      et.test_date DESC,
      et.id DESC

    LIMIT 1
    `,
    [customerId]
  );


  const [frames] = await db.query(`
    SELECT
      p.id,
      p.product_type,
      p.product_name,
      p.selling_price,
      p.product_image,
      p.shop_location,
      p.description,

      COALESCE(
        i.current_stock,
        0
      ) AS current_stock,

      COALESCE(
        i.low_stock_limit,
        0
      ) AS low_stock_limit

    FROM products p

    LEFT JOIN inventory i
      ON p.id = i.product_id

    WHERE
      p.product_type = 'Frame'
      AND p.is_active = TRUE
      AND COALESCE(i.current_stock, 0) > 0

    ORDER BY p.product_name ASC
  `);


  return {
    customer: customers[0],

    latestEyeTest:
      eyeTests.length > 0
        ? eyeTests[0]
        : null,

    frames,
  };
};


// =====================================================
// GET ALL SALES
// =====================================================

export const getAllSalesService = async () => {

  const [sales] = await db.query(`
    SELECT
      s.id,
      s.customer_id,

      c.name AS customer_name,
      c.mobile AS customer_mobile,

      s.eye_test_id,

      s.subtotal,
      s.discount_percent,
      s.discount_amount,

      s.gst_enabled,
      s.gst_percent,
      s.gst_amount,

      s.grand_total,

      s.payment_status,
      s.payment_method,

      s.sale_date,
      s.notes,
      s.created_at

    FROM sales s

    INNER JOIN customers c
      ON s.customer_id = c.id

    ORDER BY s.sale_date DESC
  `);

  return sales;
};


// =====================================================
// GET SALE BY ID
// =====================================================

export const getSaleByIdService = async (saleId) => {

  const [sales] = await db.query(
    `
    SELECT
      s.id,
      s.customer_id,

      c.name AS customer_name,
      c.mobile AS customer_mobile,
      c.email AS customer_email,
      c.address AS customer_address,
      c.city AS customer_city,
      c.state AS customer_state,
      c.pincode AS customer_pincode,

      s.eye_test_id,

      s.subtotal,
      s.discount_percent,
      s.discount_amount,

      s.gst_enabled,
      s.gst_percent,
      s.gst_amount,

      s.grand_total,

      s.payment_status,
      s.payment_method,

      s.sale_date,
      s.created_at,
      s.notes

    FROM sales s

    LEFT JOIN customers c
      ON c.id = s.customer_id

    WHERE s.id = ?

    LIMIT 1
    `,
    [saleId]
  );


  if (sales.length === 0) {
    return null;
  }


  const [items] = await db.query(
    `
    SELECT
      id,
      sale_id,
      item_type,
      product_id,
      item_name,
      quantity,
      unit_price,
      total_price
    FROM sale_items
    WHERE sale_id = ?
    ORDER BY id ASC
    `,
    [saleId]
  );


  return {
    sale: sales[0],
    items,
  };
};