import db from "../config/db.js";

// =====================================================
// GET ALL CUSTOMERS
// GET /api/customers
// =====================================================

export const getCustomers = async (req, res) => {
  try {
    const [customers] = await db.query(`
      SELECT
        id,
        name,
        mobile,
        created_at,
        updated_at
      FROM customers
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Get Customers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};


// =====================================================
// GET CUSTOMER BY ID
// GET /api/customers/:id
// =====================================================

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const [customers] = await db.query(
      `
      SELECT
        id,
        name,
        mobile,
        created_at,
        updated_at
      FROM customers
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer: customers[0],
    });
  } catch (error) {
    console.error("Get Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
};


// =====================================================
// ADD CUSTOMER
// POST /api/customers
// =====================================================

export const createCustomer = async (req, res) => {
  try {
    const { name, mobile } = req.body;

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (!mobile || !mobile.trim()) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const cleanName = name.trim();
    const cleanMobile = mobile.trim();

    // -----------------------------------------------
    // MOBILE VALIDATION
    // -----------------------------------------------

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    // -----------------------------------------------
    // INSERT CUSTOMER
    // -----------------------------------------------

    const [result] = await db.query(
      `
      INSERT INTO customers
        (name, mobile)
      VALUES
        (?, ?)
      `,
      [cleanName, cleanMobile]
    );

    // -----------------------------------------------
    // GET CREATED CUSTOMER
    // -----------------------------------------------

    const [customers] = await db.query(
      `
      SELECT
        id,
        name,
        mobile,
        created_at,
        updated_at
      FROM customers
      WHERE id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: "Customer added successfully",
      customer: customers[0],
    });
  } catch (error) {
    console.error("Create Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add customer",
    });
  }
};


// =====================================================
// UPDATE CUSTOMER
// PUT /api/customers/:id
// =====================================================

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile } = req.body;

    // -----------------------------------------------
    // ID VALIDATION
    // -----------------------------------------------

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // -----------------------------------------------
    // FIELD VALIDATION
    // -----------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required",
      });
    }

    if (!mobile || !mobile.trim()) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    const cleanName = name.trim();
    const cleanMobile = mobile.trim();

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    // -----------------------------------------------
    // CHECK CUSTOMER
    // -----------------------------------------------

    const [existing] = await db.query(
      `
      SELECT id
      FROM customers
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // -----------------------------------------------
    // UPDATE
    // -----------------------------------------------

    await db.query(
      `
      UPDATE customers
      SET
        name = ?,
        mobile = ?
      WHERE id = ?
      `,
      [cleanName, cleanMobile, id]
    );

    // -----------------------------------------------
    // GET UPDATED CUSTOMER
    // -----------------------------------------------

    const [customers] = await db.query(
      `
      SELECT
        id,
        name,
        mobile,
        created_at,
        updated_at
      FROM customers
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: customers[0],
    });
  } catch (error) {
    console.error("Update Customer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
    });
  }
};


// =====================================================
// DELETE CUSTOMER
// DELETE /api/customers/:id
// =====================================================

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------------------------
    // ID VALIDATION
    // -----------------------------------------------

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    // -----------------------------------------------
    // CHECK CUSTOMER
    // -----------------------------------------------

    const [existing] = await db.query(
      `
      SELECT id
      FROM customers
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // -----------------------------------------------
    // DELETE
    // -----------------------------------------------

    await db.query(
      `
      DELETE FROM customers
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete Customer Error:", error);

    // Customer may already have eye tests/sales.
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        success: false,
        message:
          "Customer cannot be deleted because related records exist",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};