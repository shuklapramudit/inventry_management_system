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
// Render / Local:
//
// server/uploads
// server/uploads/products
//
// Public:
//
// /uploads/products/filename.jpg
//
// IMPORTANT:
// For production, UPLOADS_DIR can be configured
// through Render Environment Variables.
//
// Example:
//
// UPLOADS_DIR=/opt/render/project/src/server/uploads
//
// =====================================================

const uploadsPath =
  process.env.UPLOADS_DIR ||
  path.resolve(process.cwd(), "uploads");

const productsUploadsPath =
  path.join(uploadsPath, "products");

// =====================================================
// CREATE UPLOAD DIRECTORIES
// =====================================================

try {
  fs.mkdirSync(
    productsUploadsPath,
    {
      recursive: true,
    }
  );

  console.log(
    "========================================"
  );

  console.log(
    "UPLOAD CONFIGURATION"
  );

  console.log(
    "Uploads directory:",
    uploadsPath
  );

  console.log(
    "Product uploads directory:",
    productsUploadsPath
  );

  console.log(
    "Uploads directory exists:",
    fs.existsSync(uploadsPath)
  );

  console.log(
    "Products directory exists:",
    fs.existsSync(productsUploadsPath)
  );

  console.log(
    "========================================"
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
// FAVICON
// =====================================================
//
// Prevent:
//
// Route not found: GET /favicon.ico
//
// =====================================================

app.get(
  "/favicon.ico",
  (req, res) => {
    return res.status(204).end();
  }
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
      environment:
        process.env.NODE_ENV ||
        "development",
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
// UPLOADS TEST
// GET /api/uploads-test
// =====================================================
//
// This checks actual files available on
// the CURRENT Render server filesystem.
//
// =====================================================

app.get(
  "/api/uploads-test",
  (req, res) => {
    try {
      const directoryExists =
        fs.existsSync(
          productsUploadsPath
        );

      if (!directoryExists) {
        return res.status(200).json({
          success: false,
          message:
            "Product uploads directory does not exist",
          uploadsDirectory:
            uploadsPath,
          productsDirectory:
            productsUploadsPath,
        });
      }

      const files =
        fs
          .readdirSync(
            productsUploadsPath
          )
          .filter(
            (file) => {
              const ext =
                path
                  .extname(file)
                  .toLowerCase();

              return [
                ".jpg",
                ".jpeg",
                ".png",
                ".webp",
                ".gif",
              ].includes(ext);
            }
          );

      // =================================================
      // PUBLIC BASE URL
      // =================================================

      const protocol =
        req.headers["x-forwarded-proto"] ||
        req.protocol;

      const host =
        req.get("host");

      const baseUrl =
        process.env.PUBLIC_BASE_URL ||
        `${protocol}://${host}`;

      const sampleImages =
        files
          .slice(0, 20)
          .map(
            (file) =>
              `${baseUrl}/uploads/products/${encodeURIComponent(
                file
              )}`
          );

      return res.status(200).json({
        success: true,

        uploadsDirectory:
          uploadsPath,

        productsDirectory:
          productsUploadsPath,

        productsDirectoryExists:
          directoryExists,

        productImageCount:
          files.length,

        sampleImages,
      });
    } catch (error) {
      console.error(
        "Uploads Test Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to inspect uploads directory",
        error: error.message,
      });
    }
  }
);

// =====================================================
// IMAGE EXISTENCE TEST
// GET /api/uploads-test/:filename
// =====================================================

app.get(
  "/api/uploads-test/:filename",
  (req, res) => {
    try {
      const filename =
        path.basename(
          req.params.filename
        );

      const filePath =
        path.join(
          productsUploadsPath,
          filename
        );

      const exists =
        fs.existsSync(filePath);

      if (!exists) {
        return res.status(404).json({
          success: false,
          exists: false,
          filename,
          filePath,
          message:
            "Image file does not exist on the current server filesystem",
        });
      }

      const protocol =
        req.headers["x-forwarded-proto"] ||
        req.protocol;

      const host =
        req.get("host");

      const baseUrl =
        process.env.PUBLIC_BASE_URL ||
        `${protocol}://${host}`;

      return res.status(200).json({
        success: true,
        exists: true,
        filename,
        filePath,
        imageUrl:
          `${baseUrl}/uploads/products/${encodeURIComponent(
            filename
          )}`,
      });
    } catch (error) {
      console.error(
        "Image Test Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to check image",
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

app.use(
  notFound
);

// =====================================================
// GLOBAL ERROR HANDLER
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
      `Uploads physical path: ${
        uploadsPath
      }`
    );

    console.log(
      `Product images path: ${
        productsUploadsPath
      }`
    );

    console.log(
      `Uploads URL: /uploads/products/`
    );

    console.log(
      "========================================"
    );
  }
);