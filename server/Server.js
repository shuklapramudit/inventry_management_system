import "dotenv/config";

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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
// ES MODULE DIRECTORY
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// PORT
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// SERVER / BACKEND URL
// =====================================================
//
// IMPORTANT:
// Production me .env me BACKEND_URL set karna:
//
// BACKEND_URL=https://your-backend-domain.com
//
// Local development:
//
// BACKEND_URL=http://localhost:5000
//
// =====================================================

const SERVER_URL =
  process.env.BACKEND_URL ||
  `http://localhost:${PORT}`;

// =====================================================
// MAKE SERVER URL AVAILABLE TO CONTROLLERS
// =====================================================

app.locals.serverUrl = SERVER_URL;

// =====================================================
// TRUST PROXY
// =====================================================
//
// Useful when deployed on Render/Railway/etc.
// =====================================================

app.set("trust proxy", 1);

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
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
// Project structure:
//
// server/
// ├── Server.js
// ├── uploads/
// │   └── products/
// │       ├── image1.jpg
// │       ├── image2.jpg
// │       └── ...
//
// =====================================================

const uploadsPath = path.join(
  __dirname,
  "uploads"
);

const productsUploadsPath = path.join(
  uploadsPath,
  "products"
);

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
    "Uploads directory:",
    uploadsPath
  );

  console.log(
    "Product uploads directory:",
    productsUploadsPath
  );

  console.log(
    "========================================"
  );
} catch (error) {
  console.error(
    "Failed to create upload directories:",
    error
  );
}

// =====================================================
// STATIC UPLOADS
// =====================================================
//
// Database path:
//
// /uploads/products/example.jpg
//
// Public backend URL:
//
// https://your-backend-domain.com/uploads/products/example.jpg
//
// =====================================================

app.use(
  "/uploads",
  express.static(
    uploadsPath,
    {
      fallthrough: false,
      index: false,
      maxAge: "1d",

      // Allow browser to display images directly
      setHeaders: (res, filePath) => {
        res.setHeader(
          "Access-Control-Allow-Origin",
          "*"
        );

        res.setHeader(
          "Cross-Origin-Resource-Policy",
          "cross-origin"
        );

        // Cache images
        res.setHeader(
          "Cache-Control",
          "public, max-age=86400"
        );
      },
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
      serverUrl: SERVER_URL,
      uploadsUrl:
        `${SERVER_URL}/uploads`,
      environment:
        process.env.NODE_ENV ||
        "development",
    });
  }
);

// =====================================================
// UPLOADS HEALTH CHECK
// GET /api/uploads-test
// =====================================================
//
// This route helps us verify that the upload
// directory exists and is accessible.
//
// =====================================================

app.get(
  "/api/uploads-test",
  (req, res) => {
    try {
      const productsExists =
        fs.existsSync(
          productsUploadsPath
        );

      let productFiles = [];

      if (productsExists) {
        productFiles =
          fs
            .readdirSync(
              productsUploadsPath
            )
            .filter(
              (file) =>
                !file.startsWith(".")
            );
      }

      return res.status(200).json({
        success: true,

        uploadsDirectory:
          uploadsPath,

        productsDirectory:
          productsUploadsPath,

        productsDirectoryExists:
          productsExists,

        productImageCount:
          productFiles.length,

        sampleImages:
          productFiles
            .slice(0, 10)
            .map(
              (file) =>
                `${SERVER_URL}/uploads/products/${encodeURIComponent(
                  file
                )}`
            ),
      });
    } catch (error) {
      console.error(
        "Uploads test error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to read uploads directory",
        error: error.message,
      });
    }
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
// Must remain AFTER:
// 1. Static uploads
// 2. Health check
// 3. Upload test
// 4. DB test
// 5. All API routes
//
// =====================================================

app.use(
  notFound
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================
//
// MUST BE LAST
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
    console.log("");
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
      `Server running on port: ${PORT}`
    );

    console.log(
      `Server URL: ${SERVER_URL}`
    );

    console.log(
      `API URL: ${SERVER_URL}/api`
    );

    console.log(
      `Uploads URL: ${SERVER_URL}/uploads`
    );

    console.log(
      `Product Images URL: ${SERVER_URL}/uploads/products`
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

    console.log("");
  }
);