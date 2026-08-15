import db from "../config/db.js";

// =====================================================
// EYE TEST SERVICE
// =====================================================


// =====================================================
// GET ALL EYE TESTS
// =====================================================

export const getAllEyeTests = async () => {
  const [tests] = await db.query(`
    SELECT
      et.id,
      et.customer_id,

      c.name AS customer_name,
      c.mobile AS customer_mobile,

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

      et.test_date,
      et.notes,
      et.created_at,
      et.updated_at

    FROM eye_tests et

    INNER JOIN customers c
      ON et.customer_id = c.id

    LEFT JOIN lens_types lt
      ON et.lens_type_id = lt.id

    ORDER BY et.test_date DESC, et.id DESC
  `);

  return tests;
};


// =====================================================
// GET EYE TEST BY ID
// =====================================================

export const getEyeTestByIdService = async (id) => {
  const [tests] = await db.query(
    `
    SELECT
      et.id,
      et.customer_id,

      c.name AS customer_name,
      c.mobile AS customer_mobile,

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

      et.test_date,
      et.notes,
      et.created_at,
      et.updated_at

    FROM eye_tests et

    INNER JOIN customers c
      ON et.customer_id = c.id

    LEFT JOIN lens_types lt
      ON et.lens_type_id = lt.id

    WHERE et.id = ?

    LIMIT 1
    `,
    [id]
  );

  return tests[0] || null;
};


// =====================================================
// GET CUSTOMERS
// =====================================================

export const getEyeTestCustomers = async () => {
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
// GET LENS TYPES
// =====================================================

export const getEyeTestLensTypes = async () => {
  const [lensTypes] = await db.query(`
    SELECT
      id,
      name,
      description
    FROM lens_types
    WHERE is_active = TRUE
    ORDER BY name ASC
  `);

  return lensTypes;
};


// =====================================================
// GET AVAILABLE FRAMES
// =====================================================

export const getEyeTestFrames = async () => {
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

  return frames;
};


// =====================================================
// CREATE MANUAL FRAME
// =====================================================

export const createManualFrameService = async ({
  product_name,
  product_image,
  shop_location,
  description,
  low_stock_limit = 5,
  initial_stock = 0,
  purchase_price = 0,
}) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [productResult] = await connection.query(
      `
      INSERT INTO products
      (
        product_type,
        product_name,
        product_image,
        shop_location,
        description
      )
      VALUES
      (
        'Frame',
        ?,
        ?,
        ?,
        ?
      )
      `,
      [
        product_name.trim(),
        product_image || null,
        shop_location,
        description?.trim() || null,
      ]
    );

    const productId =
      productResult.insertId;

    await connection.query(
      `
      INSERT INTO inventory
      (
        product_id,
        purchased_quantity,
        sold_quantity,
        current_stock,
        low_stock_limit
      )
      VALUES
      (?, ?, 0, ?, ?)
      `,
      [
        productId,
        Number(initial_stock) || 0,
        Number(initial_stock) || 0,
        Number(low_stock_limit) || 5,
      ]
    );

    await connection.commit();

    return productId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};