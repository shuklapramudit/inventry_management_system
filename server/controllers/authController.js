import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

// =====================================================
// ADMIN LOGIN
// POST /api/auth/login
// =====================================================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // -----------------------------------------------
    // FIND ADMIN
    // -----------------------------------------------

    const [admins] = await db.query(
      `
      SELECT
        id,
        email,
        password_hash,
        name,
        is_active
      FROM admins
      WHERE email = ?
      LIMIT 1
      `,
      [email.trim().toLowerCase()]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const admin = admins[0];

    // -----------------------------------------------
    // CHECK ACTIVE
    // -----------------------------------------------

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    // -----------------------------------------------
    // CHECK PASSWORD
    // -----------------------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // -----------------------------------------------
    // CREATE JWT
    // -----------------------------------------------

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    // -----------------------------------------------
    // RESPONSE
    // -----------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};


// =====================================================
// GET CURRENT ADMIN
// GET /api/auth/me
// =====================================================

export const getMe = async (req, res) => {
  try {
    const [admins] = await db.query(
      `
      SELECT
        id,
        email,
        name,
        is_active,
        created_at
      FROM admins
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      admin: {
        ...admins[0],
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Get Admin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};