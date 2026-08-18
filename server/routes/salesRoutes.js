import express from "express";

import {
  getSalesCustomers,
  getCustomerSalesInfo,
  createSale,
  getSales,
  getSaleById,
  updatePaymentStatus,
} from "../controllers/salesController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

// =====================================================
// SALES ROUTER
// =====================================================

const router = express.Router();

// =====================================================
// 1. GET SALES CUSTOMERS
// GET /api/sales/customers
// =====================================================

router.get(
  "/customers",
  protect,
  getSalesCustomers
);

// =====================================================
// 2. GET CUSTOMER SALES INFORMATION
// GET /api/sales/customer/:customerId
// =====================================================

router.get(
  "/customer/:customerId",
  protect,
  getCustomerSalesInfo
);

// =====================================================
// 3. GET ALL SALES
// GET /api/sales
// =====================================================

router.get(
  "/",
  protect,
  getSales
);

// =====================================================
// 4. CREATE SALE
// POST /api/sales
// =====================================================

router.post(
  "/",
  protect,
  createSale
);

// =====================================================
// 5. UPDATE PAYMENT STATUS
// PATCH /api/sales/:id/payment
// =====================================================

router.patch(
  "/:id/payment",
  protect,
  updatePaymentStatus
);

// =====================================================
// 6. GET SALE BY ID
// GET /api/sales/:id
// =====================================================

router.get(
  "/:id",
  protect,
  getSaleById
);

// =====================================================
// EXPORT ROUTER
// =====================================================

export default router;