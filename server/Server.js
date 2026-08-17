import "dotenv/config";

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

// =====================================================
// DATABASE
// =====================================================

import db from "./config/db.js";

// =====================================================
// ERROR MIDDLEWARE
// =====================================================

import {
  notFound,
  errorHandler,
} from "./middleware/errorMiddleware.js";

// =====================================================
// ROUTES
// =====================================================

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import eyeTestRoutes from "./routes/eyeTestRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

// =====================================================
// APP
// =====================================================

const app = express();

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// =====================================================
// BODY PARSERS
// =====================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// =====================================================
// UPLOAD DIRECTORY
// =====================================================
//
// Physical directory:
//
// server/uploads
//
// Product images:
//
// server/uploads/products
//
// Public URL:
//
// /uploads/products/filename.jpg
//
// =====================================================

const uploadsPath = path.resolve(
  process.cwd(),
  "uploads"
);

const productsUploadsPath = path.join(
  uploadsPath,
  "products"
);

// =====================================================
// CREATE UPLOAD DIRECTORIES IF NOT EXISTS
// =====================================================

try {
  fs.mkdirSync(
    productsUploadsPath,
    {
      recursive: true,
    }
  );

  console.log(
    "Uploads directory:",
    uploadsPath
  );

  console.log(
    "Product uploads directory:",
    productsUploadsPath
  );
} catch (error) {
  console.error(
    "Failed to create uploads directories:",
    error
  );
}

// =====================================================
// STATIC UPLOADS
// =====================================================
//
// Everything inside:
//
// server/uploads
//
// will be publicly available through:
//
// /uploads
//
// Example:
//
// /uploads/products/example.jpg
//
// =====================================================

app.use(
  "/uploads",
  express.static(
    uploadsPath,
    {
      fallthrough: true,
      index: false,
      maxAge: "1d",
    }
  )
);

// =====================================================
// HEALTH CHECK
// GET /
// =====================================================

app.get(
  "/",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Chashma Plus Inventory API is running",
      status: "OK",
    });
  }
);

// =====================================================
// DATABASE TEST
// GET /api/db-test
// =====================================================

app.get(
  "/api/db-test",
  async (req, res) => {
    try {
      const [rows] =
        await db.query(
          "SELECT 1 AS connected"
        );

      return res.status(200).json({
        success: true,
        message:
          "Aiven MySQL connected successfully",
        database:
          process.env.DB_NAME ||
          "Not configured",
        result: rows,
      });
    } catch (error) {
      console.error(
        "Database Connection Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Database connection failed",
        error: error.message,
      });
    }
  }
);

// =====================================================
// AUTH ROUTES
// /api/auth
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

// =====================================================
// DASHBOARD ROUTES
// /api/dashboard
// =====================================================

app.use(
  "/api/dashboard",
  dashboardRoutes
);

// =====================================================
// CUSTOMER ROUTES
// /api/customers
// =====================================================

app.use(
  "/api/customers",
  customerRoutes
);

// =====================================================
// PRODUCT ROUTES
// /api/products
// =====================================================

app.use(
  "/api/products",
  productRoutes
);

// =====================================================
// INVENTORY ROUTES
// /api/inventory
// =====================================================

app.use(
  "/api/inventory",
  inventoryRoutes
);

// =====================================================
// EYE TEST ROUTES
// /api/eye-tests
// =====================================================

app.use(
  "/api/eye-tests",
  eyeTestRoutes
);

// =====================================================
// SALES ROUTES
// /api/sales
// =====================================================

app.use(
  "/api/sales",
  salesRoutes
);

// =====================================================
// 404 NOT FOUND
// =====================================================
//
// This must remain AFTER:
//
// 1. Static uploads
// 2. Health check
// 3. All API routes
//
// =====================================================

app.use(
  notFound
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================
//
// This must be the LAST middleware.
//
// =====================================================

app.use(
  errorHandler
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {
    console.log(
      "========================================"
    );

    console.log(
      "   CHASHMA PLUS INVENTORY SYSTEM"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      `API URL: http://localhost:${PORT}`
    );

    console.log(
      `Uploads URL: http://localhost:${PORT}/uploads`
    );

    console.log(
      `Uploads physical path: ${uploadsPath}`
    );

    console.log(
      `Product images path: ${productsUploadsPath}`
    );

    console.log(
      `Environment: ${
        process.env.NODE_ENV ||
        "development"
      }`
    );

    console.log(
      `Database: ${
        process.env.DB_NAME ||
        "Not configured"
      }`
    );

    console.log(
      "========================================"
    );
  }
);