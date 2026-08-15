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


const router =
  express.Router();


// =====================================================
// SPECIFIC ROUTES FIRST
// =====================================================


// GET /api/sales/customers

router.get(
  "/customers",
  protect,
  getSalesCustomers
);


// GET /api/sales/customer/:customerId

router.get(
  "/customer/:customerId",
  protect,
  getCustomerSalesInfo
);


// =====================================================
// SALES
// =====================================================


// GET /api/sales

router.get(
  "/",
  protect,
  getSales
);


// POST /api/sales

router.post(
  "/",
  protect,
  createSale
);


// GET /api/sales/:id

router.get(
  "/:id",
  protect,
  getSaleById
);


// PATCH /api/sales/:id/payment

router.patch(
  "/:id/payment",
  protect,
  updatePaymentStatus
);


export default router;