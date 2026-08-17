import db from "../config/db.js";

// =====================================================
// PRODUCT SERVICE
// =====================================================
// All product database operations are handled here.
// =====================================================


// =====================================================
// GET ALL ACTIVE PRODUCTS
// =====================================================

export const getProducts = async () => {
  const [rows] = await db.query(`
    SELECT
      id,
      product_type,
      product_name,
      selling_price,
      product_image,
      stock_quantity,
      minimum_stock,
      shop_location,
      description,
      is_active,
      created_at,
      updated_at
    FROM products
    WHERE is_active = 1
    ORDER BY id DESC
  `);

  return rows;
};


// =====================================================
// GET PRODUCT BY ID
// =====================================================

export const getProductById = async (id) => {
  const [rows] = await db.query(
    `
    SELECT
      id,
      product_type,
      product_name,
      selling_price,
      product_image,
      stock_quantity,
      minimum_stock,
      shop_location,
      description,
      is_active,
      created_at,
      updated_at
    FROM products
    WHERE id = ?
      AND is_active = 1
    LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
};


// =====================================================
// CREATE PRODUCT
// =====================================================

export const createProduct = async ({
  product_type,
  product_name,
  selling_price,
  product_image = null,
  stock_quantity = 0,
  minimum_stock = 5,
  shop_location = null,
  description = null,
}) => {
  const [result] = await db.query(
    `
    INSERT INTO products (
      product_type,
      product_name,
      selling_price,
      product_image,
      stock_quantity,
      minimum_stock,
      shop_location,
      description,
      is_active
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `,
    [
      product_type,
      product_name,
      selling_price,
      product_image,
      stock_quantity,
      minimum_stock,
      shop_location,
      description,
    ]
  );

  return {
    id: result.insertId,
  };
};


// =====================================================
// UPDATE PRODUCT
// =====================================================

export const updateProduct = async (
  id,
  {
    product_type,
    product_name,
    selling_price,
    product_image,
    stock_quantity,
    minimum_stock,
    shop_location,
    description,
  }
) => {
  const [result] = await db.query(
    `
    UPDATE products
    SET
      product_type = COALESCE(?, product_type),
      product_name = COALESCE(?, product_name),
      selling_price = COALESCE(?, selling_price),
      product_image = COALESCE(?, product_image),
      stock_quantity = COALESCE(?, stock_quantity),
      minimum_stock = COALESCE(?, minimum_stock),
      shop_location = COALESCE(?, shop_location),
      description = COALESCE(?, description)
    WHERE id = ?
      AND is_active = 1
    `,
    [
      product_type ?? null,
      product_name ?? null,
      selling_price ?? null,
      product_image ?? null,
      stock_quantity ?? null,
      minimum_stock ?? null,
      shop_location ?? null,
      description ?? null,
      id,
    ]
  );

  return result.affectedRows > 0;
};


// =====================================================
// DELETE PRODUCT
// =====================================================
// Soft delete.
// Product database se permanently delete nahi hoga.
// is_active = 0 hone ke baad normal product list me nahi aayega.
// =====================================================

export const deleteProduct = async (id) => {
  const [result] = await db.query(
    `
    UPDATE products
    SET is_active = 0
    WHERE id = ?
      AND is_active = 1
    `,
    [id]
  );

  return result.affectedRows > 0;
};


// =====================================================
// RESTORE PRODUCT
// =====================================================

export const restoreProduct = async (id) => {
  const [result] = await db.query(
    `
    UPDATE products
    SET is_active = 1
    WHERE id = ?
      AND is_active = 0
    `,
    [id]
  );

  return result.affectedRows > 0;
};


// =====================================================
// CHECK PRODUCT EXISTS
// =====================================================

export const productExists = async (id) => {
  const [rows] = await db.query(
    `
    SELECT id
    FROM products
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows.length > 0;
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  productExists,
};