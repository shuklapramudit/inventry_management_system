import multer from "multer";
import path from "path";
import fs from "fs";

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "products"
);

// =====================================================
// CREATE DIRECTORY
// =====================================================

if (
  !fs.existsSync(uploadDirectory)
) {
  fs.mkdirSync(
    uploadDirectory,
    {
      recursive: true,
    }
  );
}

// =====================================================
// STORAGE
// =====================================================

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        uploadDirectory
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const extension =
        path
          .extname(
            file.originalname
          )
          .toLowerCase();

      const baseName =
        path
          .basename(
            file.originalname,
            extension
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          );

      const uniqueName =
        `${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}-${baseName}${extension}`;

      cb(
        null,
        uniqueName
      );
    },
  });

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

  const extension =
    path
      .extname(
        file.originalname
      )
      .toLowerCase();

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
// MULTER
// =====================================================

const upload =
  multer({
    storage,
    fileFilter,

    limits: {
      files: 5,
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
// ERROR HANDLER
// =====================================================

export const handleUploadError = (
  err,
  req,
  res,
  next
) => {
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

    return res.status(400).json({
      success: false,
      message:
        `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message:
        err.message,
    });
  }

  next();
};