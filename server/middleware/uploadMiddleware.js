import multer from "multer";

// =====================================================
// MULTER MEMORY STORAGE
// =====================================================
//
// IMPORTANT:
//
// Images Render ke local filesystem me save nahi hongi.
//
// Files temporarily memory me rahengi.
//
// Product controller in files ko directly
// Cloudinary par upload karega.
//
// =====================================================

const storage = multer.memoryStorage();

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (
  req,
  file,
  cb
) => {

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const originalName =
    file.originalname || "";

  const lastDotIndex =
    originalName.lastIndexOf(".");

  const extension =
    lastDotIndex !== -1
      ? originalName
          .substring(lastDotIndex)
          .toLowerCase()
      : "";

  if (
    allowedMimeTypes.includes(
      file.mimetype
    ) &&
    allowedExtensions.includes(
      extension
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      ),
      false
    );
  }
};

// =====================================================
// MULTER CONFIGURATION
// =====================================================

const upload = multer({

  storage,

  fileFilter,

  limits: {

    // Maximum 5 images
    files: 5,

    // Maximum 5MB per image
    fileSize:
      5 * 1024 * 1024,

  },

});

// =====================================================
// PRODUCT IMAGES
// =====================================================

export const uploadProductImages =
  upload.array(
    "product_images",
    5
  );

// =====================================================
// UPLOAD ERROR HANDLER
// =====================================================

export const handleUploadError = (
  err,
  req,
  res,
  next
) => {

  // -------------------------------------------------
  // MULTER ERROR
  // -------------------------------------------------

  if (
    err instanceof
    multer.MulterError
  ) {

    if (
      err.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Each image must be less than 5MB.",
      });
    }

    if (
      err.code ===
      "LIMIT_FILE_COUNT"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum 5 images are allowed.",
      });
    }

    if (
      err.code ===
      "LIMIT_UNEXPECTED_FILE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unexpected image field. Use product_images.",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        `Upload error: ${err.message}`,
    });
  }

  // -------------------------------------------------
  // FILE FILTER ERROR
  // -------------------------------------------------

  if (err) {
    return res.status(400).json({
      success: false,
      message:
        err.message,
    });
  }

  next();
};

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default upload;