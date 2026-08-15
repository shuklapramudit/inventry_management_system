import express from "express";

import {
  getInventory,
  getLowStock,
  getInventoryByProduct,
  addPurchase,
  adjustStock,
} from "../controllers/inventoryController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// INVENTORY ROUTES
// =====================================================

// GET /api/inventory
router.get("/", protect, getInventory);

// GET /api/inventory/low-stock
router.get(
  "/low-stock",
  protect,
  getLowStock
);

// GET /api/inventory/product/:productId
router.get(
  "/product/:productId",
  protect,
  getInventoryByProduct
);

// POST /api/inventory/purchase
router.post(
  "/purchase",
  protect,
  addPurchase
);

// PATCH /api/inventory/:productId/adjust
router.patch(
  "/:productId/adjust",
  protect,
  adjustStock
);

export default router;