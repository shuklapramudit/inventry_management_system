import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

// =====================================================
// CLOUDINARY CONFIGURATION
// =====================================================

cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET,
});

// =====================================================
// CLOUDINARY CONFIG CHECK
// =====================================================

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    "================================================="
  );

  console.warn(
    "WARNING: Cloudinary environment variables are missing."
  );

  console.warn(
    "Please configure:"
  );

  console.warn(
    "CLOUDINARY_CLOUD_NAME"
  );

  console.warn(
    "CLOUDINARY_API_KEY"
  );

  console.warn(
    "CLOUDINARY_API_SECRET"
  );

  console.warn(
    "================================================="
  );
} else {
  console.log(
    "Cloudinary configured successfully."
  );

  console.log(
    `Cloudinary Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`
  );
}

// =====================================================
// EXPORT
// =====================================================

export default cloudinary;