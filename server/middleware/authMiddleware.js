import jwt from "jsonwebtoken";


// =====================================================
// PROTECT ROUTES
// =====================================================

export const protect = (
  req,
  res,
  next
) => {

  try {

    // =================================================
    // GET AUTHORIZATION HEADER
    // =================================================

    const authHeader =
      req.headers.authorization;


    if (!authHeader) {

      return res.status(401).json({
        success: false,
        message:
          "Authorization token is required",
      });

    }


    // =================================================
    // CHECK BEARER FORMAT
    // =================================================

    if (
      !authHeader.startsWith("Bearer ")
    ) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format",
      });

    }


    // =================================================
    // EXTRACT TOKEN
    // =================================================

    const token =
      authHeader
        .substring(7)
        .trim();


    if (!token) {

      return res.status(401).json({
        success: false,
        message:
          "Token is missing",
      });

    }


    // =================================================
    // CHECK JWT SECRET
    // =================================================

    if (!process.env.JWT_SECRET) {

      console.error(
        "JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration error",
      });

    }


    // =================================================
    // VERIFY TOKEN
    // =================================================

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    // =================================================
    // CHECK DECODED TOKEN
    // =================================================

    if (
      !decoded ||
      !decoded.id
    ) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });

    }


    // =================================================
    // ADMIN CHECK
    // =================================================

    if (
      decoded.role &&
      decoded.role !== "admin"
    ) {

      return res.status(403).json({
        success: false,
        message:
          "Admin access required",
      });

    }


    // =================================================
    // ATTACH USER
    // =================================================

    req.user = decoded;


    // =================================================
    // CONTINUE
    // =================================================

    return next();

  } catch (error) {

    console.error(
      "Auth Middleware Error:",
      error.message
    );


    // =================================================
    // EXPIRED TOKEN
    // =================================================

    if (
      error.name ===
      "TokenExpiredError"
    ) {

      return res.status(401).json({
        success: false,
        message:
          "Token has expired",
      });

    }


    // =================================================
    // INVALID TOKEN
    // =================================================

    if (
      error.name ===
      "JsonWebTokenError"
    ) {

      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired token",
      });

    }


    // =================================================
    // OTHER AUTH ERROR
    // =================================================

    return res.status(401).json({
      success: false,
      message:
        "Authentication failed",
    });

  }

};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default protect;