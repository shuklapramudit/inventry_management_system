import express from "express";

import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// ALL CUSTOMER ROUTES ARE ADMIN PROTECTED
// =====================================================

// GET /api/customers
router.get("/", protect, getCustomers);

// GET /api/customers/:id
router.get("/:id", protect, getCustomerById);

// POST /api/customers
router.post("/", protect, createCustomer);

// PUT /api/customers/:id
router.put("/:id", protect, updateCustomer);

// DELETE /api/customers/:id
router.delete("/:id", protect, deleteCustomer);

export default router;