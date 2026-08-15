import express from "express";

import {
  getEyeTests,
  getEyeTestById,
  getEyeTestsByCustomer,
  getCustomersForEyeTest,
  getLensTypes,
  getFramesForEyeTest,
  createManualFrame,
  createEyeTest,
  updateEyeTest,
  deleteEyeTest,
} from "../controllers/eyeTestController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================================
// CUSTOMER LIST
// GET /api/eye-tests/customers
// =====================================================

router.get(
  "/customers",
  protect,
  getCustomersForEyeTest
);


// =====================================================
// LENS TYPES
// GET /api/eye-tests/lens-types
// =====================================================

router.get(
  "/lens-types",
  protect,
  getLensTypes
);


// =====================================================
// AVAILABLE FRAMES
// GET /api/eye-tests/frames
// =====================================================

router.get(
  "/frames",
  protect,
  getFramesForEyeTest
);


// =====================================================
// CUSTOMER EYE TEST HISTORY
// GET /api/eye-tests/customer/:customerId
// =====================================================

router.get(
  "/customer/:customerId",
  protect,
  getEyeTestsByCustomer
);


// =====================================================
// CREATE MANUAL FRAME
// POST /api/eye-tests/frames
// =====================================================

router.post(
  "/frames",
  protect,
  createManualFrame
);


// =====================================================
// GET ALL EYE TESTS
// GET /api/eye-tests
// =====================================================

router.get(
  "/",
  protect,
  getEyeTests
);


// =====================================================
// CREATE EYE TEST
// POST /api/eye-tests
// =====================================================

router.post(
  "/",
  protect,
  createEyeTest
);


// =====================================================
// GET SINGLE EYE TEST
// GET /api/eye-tests/:id
// =====================================================

router.get(
  "/:id",
  protect,
  getEyeTestById
);


// =====================================================
// UPDATE EYE TEST
// PUT /api/eye-tests/:id
// =====================================================

router.put(
  "/:id",
  protect,
  updateEyeTest
);


// =====================================================
// DELETE EYE TEST
// DELETE /api/eye-tests/:id
// =====================================================

router.delete(
  "/:id",
  protect,
  deleteEyeTest
);


export default router;