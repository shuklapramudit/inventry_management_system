import multer from "multer";

// =====================================================
// MULTER MEMORY STORAGE
// =====================================================
//
// IMPORTANT:
// Render/server local filesystem par product images
// permanently save nahi karni hain.
//
// Files temporary memory me rahengi.
// productController.js in files ko Cloudinary ya
// kisi permanent storage par upload kar sakta hai.
//
// =====================================================

const storage = multer.memoryStorage();


// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
  try {
    // -------------------------------------------------
    // ALLOWED MIME TYPES
    // -------------------------------------------------

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    // -------------------------------------------------
    // ALLOWED EXTENSIONS
    // -------------------------------------------------

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ];

    // -------------------------------------------------
    // ORIGINAL FILE NAME
    // -------------------------------------------------

    const originalName =
      file.originalname || "";

    // -------------------------------------------------
    // GET EXTENSION
    // -------------------------------------------------

    const lastDotIndex =
      originalName.lastIndexOf(".");

    const extension =
      lastDotIndex !== -1
        ? originalName
            .substring(lastDotIndex)
            .toLowerCase()
        : "";

    // -------------------------------------------------
    // VALIDATE
    // -------------------------------------------------

    if (
      allowedMimeTypes.includes(file.mimetype) &&
      allowedExtensions.includes(extension)
    ) {
      return cb(null, true);
    }

    return cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      ),
      false
    );

  } catch (error) {
    return cb(error, false);
  }
};


// =====================================================
// MULTER INSTANCE
// =====================================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    // Maximum 5 files
    files: 5,

    // Maximum 5MB per file
    fileSize: 5 * 1024 * 1024,
  },
});


// =====================================================
// PRODUCT IMAGE UPLOAD
// =====================================================
//
// Frontend FormData field:
// product_images
//
// Maximum:
// 5 images
//
// =====================================================

export const uploadProductImages =
  upload.array(
    "product_images",
    5
  );


// =====================================================
// UPLOAD ERROR HANDLER
// =====================================================
//
// IMPORTANT:
// This MUST be a NAMED EXPORT because
// productRoutes.js imports it using:
//
// import {
//   uploadProductImages,
//   handleUploadError
// } from "../middleware/uploadMiddleware.js";
//
// =====================================================

export const handleUploadError = (
  err,
  req,
  res,
  next
) => {

  // -------------------------------------------------
  // NO ERROR
  // -------------------------------------------------

  if (!err) {
    return next();
  }

  // -------------------------------------------------
  // MULTER ERROR
  // -------------------------------------------------

  if (err instanceof multer.MulterError) {

    // -----------------------------------------------
    // FILE TOO LARGE
    // -----------------------------------------------

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "Each image must be less than 5MB.",
      });
    }

    // -----------------------------------------------
    // TOO MANY FILES
    // -----------------------------------------------

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message:
          "Maximum 5 images are allowed.",
      });
    }

    // -----------------------------------------------
    // WRONG FIELD
    // -----------------------------------------------

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message:
          "Unexpected image field. Use 'product_images'.",
      });
    }

    // -----------------------------------------------
    // OTHER MULTER ERROR
    // -----------------------------------------------

    return res.status(400).json({
      success: false,
      message:
        `Upload error: ${err.message}`,
    });
  }

  // -------------------------------------------------
  // CUSTOM FILE FILTER ERROR
  // -------------------------------------------------

  return res.status(400).json({
    success: false,
    message:
      err.message || "Image upload failed.",
  });
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default upload;