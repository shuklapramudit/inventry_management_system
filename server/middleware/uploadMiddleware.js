import multer from "multer";

// =====================================================
// MULTER MEMORY STORAGE
// =====================================================
//
// IMPORTANT:
//
// Images Render ke local filesystem me save nahi hongi.
//
// Images temporarily memory me rahengi.
//
// Uske baad productController.js se directly
// Cloudinary par upload ki jayengi.
//
// =====================================================

const storage =
  multer.memoryStorage();


// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (
  req,
  file,
  cb
) => {

  // -------------------------------------------------
  // ALLOWED MIME TYPES
  // -------------------------------------------------

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];


  // -------------------------------------------------
  // ALLOWED FILE EXTENSIONS
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
  // GET FILE EXTENSION
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
  // VALIDATE FILE
  // -------------------------------------------------

  if (
    allowedMimeTypes.includes(
      file.mimetype
    ) &&
    allowedExtensions.includes(
      extension
    )
  ) {

    cb(
      null,
      true
    );

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

const upload =
  multer({

    // -------------------------------------------------
    // MEMORY STORAGE
    // -------------------------------------------------

    storage,


    // -------------------------------------------------
    // FILE FILTER
    // -------------------------------------------------

    fileFilter,


    // -------------------------------------------------
    // LIMITS
    // -------------------------------------------------

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
//
// Frontend field name MUST remain:
//
// product_images
//
// Maximum images:
//
// 5
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

    // -----------------------------------------------
    // FILE SIZE ERROR
    // -----------------------------------------------

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


    // -----------------------------------------------
    // FILE COUNT ERROR
    // -----------------------------------------------

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


    // -----------------------------------------------
    // OTHER MULTER ERRORS
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

  if (err) {

    return res.status(400).json({

      success: false,

      message:
        err.message,

    });

  }


  // -------------------------------------------------
  // CONTINUE
  // -------------------------------------------------

  next();
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default upload;