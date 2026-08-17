import db from "../config/db.js";

// =====================================================
// ALLOWED DISCOUNTS
// =====================================================

const ALLOWED_DISCOUNTS = [
  0,
  5,
  10,
  15,
  20,
  25,
  30,
];

// =====================================================
// NORMALIZE PAYMENT STATUS
// =====================================================

const normalizePaymentStatus = (value) => {
  const status = String(value || "PENDING")
    .trim()
    .toUpperCase();

  if (
    [
      "PENDING",
      "PAID",
      "PARTIAL",
    ].includes(status)
  ) {
    return status;
  }

  return "PENDING";
};

// =====================================================
// SAFE NUMBER
// =====================================================

const toNumber = (
  value,
  fallback = 0
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

// =====================================================
// PRODUCT TYPES ALLOWED FOR SALES
// =====================================================

const SALES_PRODUCT_TYPES = [
  "Frame",
  "Sunglass",
  "Sunglasses",
];

// =====================================================
// GET SALES CUSTOMERS
// GET /api/sales/customers
// =====================================================

export const getSalesCustomers = async (
  req,
  res
) => {
  try {
    const [customers] =
      await db.query(
        `
        SELECT
          id,
          name,
          mobile
        FROM customers
        ORDER BY name ASC
        `
      );

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error(
      "Get Sales Customers Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch customers",
      error: error.message,
      sqlMessage:
        error.sqlMessage || null,
      code:
        error.code || null,
    });
  }
};

// =====================================================
// GET CUSTOMER SALES INFORMATION
// GET /api/sales/customer/:customerId
// =====================================================

export const getCustomerSalesInfo =
  async (
    req,
    res
  ) => {
    try {
      const customerId =
        Number(
          req.params.customerId
        );

      if (
        !Number.isInteger(
          customerId
        ) ||
        customerId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer ID",
        });
      }

      // =================================================
      // CUSTOMER
      // =================================================

      const [customers] =
        await db.query(
          `
          SELECT
            id,
            name,
            mobile,
            email,
            address,
            city,
            state,
            pincode
          FROM customers
          WHERE id = ?
          LIMIT 1
          `,
          [customerId]
        );

      if (
        customers.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Customer not found",
        });
      }

      // =================================================
      // LATEST EYE TEST
      // =================================================

      const [eyeTests] =
        await db.query(
          `
          SELECT
            et.id,
            et.customer_id,

            et.right_sph,
            et.right_cyl,
            et.right_axis,
            et.right_add,
            et.right_pd,

            et.left_sph,
            et.left_cyl,
            et.left_axis,
            et.left_add,
            et.left_pd,

            et.lens_type_id,

            COALESCE(
              lt.name,
              et.lens_type_name
            ) AS lens_type,

            et.lens_type_name,
            et.lens_price,

            et.frame_product_id,
            et.frame_name,
            et.frame_price,

            et.test_date

          FROM eye_tests et

          LEFT JOIN lens_types lt
            ON et.lens_type_id = lt.id

          WHERE et.customer_id = ?

          ORDER BY
            et.test_date DESC,
            et.id DESC

          LIMIT 1
          `,
          [customerId]
        );

      // =================================================
      // RETURN
      // =================================================

      return res.status(200).json({
        success: true,
        customer:
          customers[0],
        eyeTest:
          eyeTests.length > 0
            ? eyeTests[0]
            : null,
      });
    } catch (error) {
      console.error(
        "Get Customer Sales Info Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch customer sales information",
        error: error.message,
      });
    }
  };

// =====================================================
// GET SALES PRODUCTS
// GET /api/sales/products
// =====================================================

export const getSalesProducts =
  async (
    req,
    res
  ) => {
    try {
      const [products] =
        await db.query(
          `
          SELECT
            id,
            product_type,
            product_name,
            selling_price,
            stock_quantity,
            minimum_stock,
            product_image,
            shop_location,
            description,
            is_active
          FROM products
          WHERE is_active = 1
          AND product_type IN (
            'Frame',
            'Sunglass',
            'Sunglasses'
          )
          ORDER BY
            product_name ASC
          `
        );

      return res.status(200).json({
        success: true,
        count: products.length,
        products,
      });
    } catch (error) {
      console.error(
        "Get Sales Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch sales products",
        error: error.message,
      });
    }
  };

// =====================================================
// CREATE SALE
// POST /api/sales
// =====================================================

export const createSale =
  async (
    req,
    res
  ) => {
    const connection =
      await db.getConnection();

    try {
      const {
        customer_id,
        items = [],
        discount_percent = 0,
        payment_method = "CASH",
        payment_status = "PENDING",

        // =================================================
        // ADVANCE RECEIVED
        // =================================================

        advance_amount = 0,

        notes = "",
      } = req.body;

      // =================================================
      // CUSTOMER ID
      // =================================================

      const customerId =
        Number(customer_id);

      if (
        !Number.isInteger(
          customerId
        ) ||
        customerId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid customer is required",
        });
      }

      // =================================================
      // ITEMS
      // =================================================

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one sale item is required",
        });
      }

      // =================================================
      // DISCOUNT
      // =================================================

      const discountPercent =
        toNumber(
          discount_percent,
          0
        );

      if (
        !ALLOWED_DISCOUNTS.includes(
          discountPercent
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid discount percentage",
        });
      }

      // =================================================
      // PAYMENT STATUS
      // =================================================

      let finalPaymentStatus =
        normalizePaymentStatus(
          payment_status
        );

      // =================================================
      // ADVANCE
      // =================================================

      let advanceAmount =
        toNumber(
          advance_amount,
          0
        );

      if (
        advanceAmount < 0
      ) {
        advanceAmount = 0;
      }

      await connection.beginTransaction();

      // =================================================
      // CUSTOMER CHECK
      // =================================================

      const [
        customerRows,
      ] = await connection.query(
        `
        SELECT
          id,
          name,
          mobile
        FROM customers
        WHERE id = ?
        LIMIT 1
        `,
        [customerId]
      );

      if (
        customerRows.length === 0
      ) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Customer not found",
        });
      }

      // =================================================
      // CALCULATE ITEMS
      // =================================================

      let subtotal = 0;

      const saleItems = [];

      for (
        const item of items
      ) {
        const productId =
          Number(
            item.product_id ||
            item.frame_product_id
          );

        const quantity =
          Number(
            item.quantity || 1
          );

        if (
          !Number.isInteger(
            productId
          ) ||
          productId <= 0
        ) {
          throw new Error(
            "Invalid product ID"
          );
        }

        if (
          !Number.isInteger(
            quantity
          ) ||
          quantity <= 0
        ) {
          throw new Error(
            "Invalid quantity"
          );
        }

        // ===============================================
        // PRODUCT
        // ===============================================

        const [
          productRows,
        ] = await connection.query(
          `
          SELECT
            id,
            product_type,
            product_name,
            selling_price,
            stock_quantity,
            is_active
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [productId]
        );

        if (
          productRows.length === 0
        ) {
          throw new Error(
            `Product not found: ${productId}`
          );
        }

        const product =
          productRows[0];

        if (
          !SALES_PRODUCT_TYPES.includes(
            product.product_type
          )
        ) {
          throw new Error(
            `${product.product_name} is not a valid sales product`
          );
        }

        if (
          Number(
            product.is_active
          ) !== 1
        ) {
          throw new Error(
            `${product.product_name} is inactive`
          );
        }

        // ===============================================
        // STOCK CHECK
        // ===============================================

        if (
          Number(
            product.stock_quantity
          ) < quantity
        ) {
          throw new Error(
            `Insufficient stock for ${product.product_name}`
          );
        }

        // ===============================================
        // PRICE
        // ===============================================

        const unitPrice =
          toNumber(
            item.unit_price,
            product.selling_price
          );

        const totalPrice =
          unitPrice * quantity;

        subtotal += totalPrice;

        saleItems.push({
          product_id:
            product.id,

          item_type:
            product.product_type,

          item_name:
            product.product_name,

          quantity,

          unit_price:
            unitPrice,

          total_price:
            totalPrice,
        });
      }

      // =================================================
      // DISCOUNT AMOUNT
      // =================================================

      const discountAmount =
        subtotal *
        (discountPercent / 100);

      // =================================================
      // AFTER DISCOUNT
      // =================================================

      const taxableAmount =
        subtotal -
        discountAmount;

      // =================================================
      // GST
      // =================================================

      const gstPercent =
        toNumber(
          req.body.gst_percent,
          0
        );

      const gstAmount =
        taxableAmount *
        (gstPercent / 100);

      // =================================================
      // GRAND TOTAL
      // =================================================

      const grandTotal =
        taxableAmount +
        gstAmount;

      // =================================================
      // ADVANCE VALIDATION
      // =================================================

      if (
        advanceAmount >
        grandTotal
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Advance amount cannot be greater than grand total",
          grand_total:
            Number(
              grandTotal.toFixed(2)
            ),
          advance_amount:
            Number(
              advanceAmount.toFixed(2)
            ),
          balance_due: 0,
        });
      }

      // =================================================
      // BALANCE DUE
      // =================================================

      const balanceDue =
        Math.max(
          0,
          grandTotal -
            advanceAmount
        );

      // =================================================
      // AUTO PAYMENT STATUS
      // =================================================

      if (
        advanceAmount >=
          grandTotal &&
        grandTotal > 0
      ) {
        finalPaymentStatus =
          "PAID";
      } else if (
        advanceAmount > 0
      ) {
        finalPaymentStatus =
          "PARTIAL";
      }

      // =================================================
      // INSERT SALE
      // =================================================

      const [
        saleResult,
      ] = await connection.query(
        `
        INSERT INTO sales (
          customer_id,
          subtotal,
          discount_percent,
          discount_amount,
          gst_percent,
          gst_amount,
          grand_total,
          advance_amount,
          payment_method,
          payment_status,
          notes
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
        `,
        [
          customerId,

          subtotal,

          discountPercent,

          discountAmount,

          gstPercent,

          gstAmount,

          grandTotal,

          advanceAmount,

          payment_method,

          finalPaymentStatus,

          notes,
        ]
      );

      const saleId =
        saleResult.insertId;

      // =================================================
      // INSERT SALE ITEMS
      // =================================================

      for (
        const item of saleItems
      ) {
        await connection.query(
          `
          INSERT INTO sale_items (
            sale_id,
            product_id,
            item_type,
            item_name,
            quantity,
            unit_price,
            total_price
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
          `,
          [
            saleId,

            item.product_id,

            item.item_type,

            item.item_name,

            item.quantity,

            item.unit_price,

            item.total_price,
          ]
        );

        // ===============================================
        // REDUCE STOCK
        // ===============================================

        await connection.query(
          `
          UPDATE products
          SET stock_quantity =
              stock_quantity - ?
          WHERE id = ?
          AND stock_quantity >= ?
          `,
          [
            item.quantity,

            item.product_id,

            item.quantity,
          ]
        );
      }

      await connection.commit();

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(201).json({
        success: true,

        message:
          "Sale created successfully",

        sale: {
          id: saleId,

          customer_id:
            customerId,

          subtotal:
            Number(
              subtotal.toFixed(2)
            ),

          discount_percent:
            discountPercent,

          discount_amount:
            Number(
              discountAmount.toFixed(2)
            ),

          gst_percent:
            gstPercent,

          gst_amount:
            Number(
              gstAmount.toFixed(2)
            ),

          grand_total:
            Number(
              grandTotal.toFixed(2)
            ),

          // =============================================
          // NEW
          // =============================================

          advance_amount:
            Number(
              advanceAmount.toFixed(2)
            ),

          balance_due:
            Number(
              balanceDue.toFixed(2)
            ),

          payment_method,

          payment_status:
            finalPaymentStatus,

          notes,
        },

        items:
          saleItems,
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch {}

      console.error(
        "Create Sale Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to create sale",
        error:
          error.message,
        sqlMessage:
          error.sqlMessage ||
          null,
        code:
          error.code ||
          null,
      });
    } finally {
      connection.release();
    }
  };

// =====================================================
// GET ALL SALES
// GET /api/sales
// =====================================================

export const getSales =
  async (
    req,
    res
  ) => {
    try {
      const [
        sales,
      ] = await db.query(
        `
        SELECT
          s.id,
          s.customer_id,

          c.name AS customer_name,
          c.mobile AS customer_mobile,

          s.subtotal,
          s.discount_percent,
          s.discount_amount,
          s.gst_percent,
          s.gst_amount,
          s.grand_total,

          s.advance_amount,

          s.payment_method,
          s.payment_status,

          s.notes,

          s.sale_date,
          s.created_at,
          s.updated_at

        FROM sales s

        LEFT JOIN customers c
          ON s.customer_id = c.id

        ORDER BY
          s.id DESC
        `
      );

      return res.status(200).json({
        success: true,
        count: sales.length,
        sales:
          sales.map(
            (sale) => ({
              ...sale,

              balance_due:
                Math.max(
                  0,
                  Number(
                    sale.grand_total || 0
                  ) -
                    Number(
                      sale.advance_amount ||
                        0
                    )
                ),
            })
          ),
      });
    } catch (error) {
      console.error(
        "Get Sales Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch sales",
        error: error.message,
      });
    }
  };

// =====================================================
// GET SALE BY ID
// GET /api/sales/:id
// =====================================================

export const getSaleById =
  async (
    req,
    res
  ) => {
    try {
      const saleId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          saleId
        ) ||
        saleId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid sale ID",
        });
      }

      // =================================================
      // SALE
      // =================================================

      const [
        sales,
      ] = await db.query(
        `
        SELECT
          s.id,
          s.customer_id,

          c.name AS customer_name,
          c.mobile AS customer_mobile,

          s.subtotal,
          s.discount_percent,
          s.discount_amount,

          s.gst_percent,
          s.gst_amount,

          s.grand_total,

          s.advance_amount,

          s.payment_method,
          s.payment_status,

          s.notes,

          s.sale_date,
          s.created_at,
          s.updated_at

        FROM sales s

        LEFT JOIN customers c
          ON s.customer_id = c.id

        WHERE s.id = ?

        LIMIT 1
        `,
        [saleId]
      );

      if (
        sales.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Sale not found",
        });
      }

      // =================================================
      // ITEMS
      // =================================================

      const [
        items,
      ] = await db.query(
        `
        SELECT
          id,
          sale_id,
          product_id,
          item_type,
          item_name,
          quantity,
          unit_price,
          total_price
        FROM sale_items
        WHERE sale_id = ?
        ORDER BY id ASC
        `,
        [saleId]
      );

      const sale =
        sales[0];

      const grandTotal =
        Number(
          sale.grand_total || 0
        );

      const advanceAmount =
        Number(
          sale.advance_amount || 0
        );

      const balanceDue =
        Math.max(
          0,
          grandTotal -
            advanceAmount
        );

      return res.status(200).json({
        success: true,

        sale: {
          ...sale,

          advance_amount:
            advanceAmount,

          balance_due:
            balanceDue,
        },

        items,
      });
    } catch (error) {
      console.error(
        "Get Sale By ID Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch sale",
        error: error.message,
      });
    }
  };

// =====================================================
// UPDATE PAYMENT STATUS
// PATCH /api/sales/:id/payment
// =====================================================

export const updatePaymentStatus =
  async (
    req,
    res
  ) => {
    try {
      const saleId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          saleId
        ) ||
        saleId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid sale ID",
        });
      }

      const status =
        normalizePaymentStatus(
          req.body.payment_status
        );

      const [
        result,
      ] = await db.query(
        `
        UPDATE sales
        SET
          payment_status = ?
        WHERE id = ?
        `,
        [
          status,
          saleId,
        ]
      );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Sale not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Payment status updated successfully",
        payment_status:
          status,
      });
    } catch (error) {
      console.error(
        "Update Payment Status Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update payment status",
        error: error.message,
      });
    }
  };