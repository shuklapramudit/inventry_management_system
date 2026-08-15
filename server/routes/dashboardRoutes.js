import express from "express";

import {
  getDashboard,
  getMonthlySales,
  getYearlySales,
  getLowStock,
} from "../controllers/dashboardController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================================
// MAIN DASHBOARD
// GET /api/dashboard
// =====================================================

router.get(
  "/",
  protect,
  getDashboard
);


// =====================================================
// MONTHLY SALES
// GET /api/dashboard/monthly-sales
// =====================================================

router.get(
  "/monthly-sales",
  protect,
  getMonthlySales
);


// =====================================================
// YEARLY SALES
// GET /api/dashboard/yearly-sales
// =====================================================

router.get(
  "/yearly-sales",
  protect,
  getYearlySales
);


// =====================================================
// LOW STOCK
// GET /api/dashboard/low-stock
// =====================================================

router.get(
  "/low-stock",
  protect,
  getLowStock
);


export default router;