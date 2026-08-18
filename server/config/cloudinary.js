import { v2 as cloudinary } from "cloudinary";


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
// CONFIGURATION CHECK
// =====================================================

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {

  console.warn(
    "WARNING: Cloudinary environment variables are not completely configured."
  );

}


export default cloudinary;