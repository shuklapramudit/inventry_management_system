import express from "express";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  replaceProductImages,
} from "../controllers/productController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  uploadProductImages,
  handleUploadError,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

// =====================================================
// GET ALL PRODUCTS
// GET /api/products
// =====================================================

router.get(
  "/",
  protect,
  getProducts
);

// =====================================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// =====================================================

router.get(
  "/:id",
  protect,
  getProductById
);

// =====================================================
// CREATE PRODUCT
// POST /api/products
// =====================================================

router.post(
  "/",
  protect,
  uploadProductImages,
  handleUploadError,
  createProduct
);

// =====================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// =====================================================

router.put(
  "/:id",
  protect,
  uploadProductImages,
  handleUploadError,
  updateProduct
);

// =====================================================
// REPLACE PRODUCT IMAGES
// PUT /api/products/:id/images
// =====================================================
//
// Existing product ki images ko Cloudinary par upload
// karke DB me permanent Cloudinary URLs save karega.
//
// IMPORTANT:
// Field name = product_images
// Maximum = 5
//
// =====================================================

router.put(
  "/:id/images",
  protect,
  uploadProductImages,
  handleUploadError,
  replaceProductImages
);

// =====================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// =====================================================

router.delete(
  "/:id",
  protect,
  deleteProduct
);

// =====================================================
// RESTORE PRODUCT
// PATCH /api/products/:id/restore
// =====================================================

router.patch(
  "/:id/restore",
  protect,
  restoreProduct
);

export default router;