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
//
// Existing frontend uses frame_product_id.
// We keep that field unchanged so current frontend
// functionality does not break.
//
// Both Frame and Sunglass are allowed.
//
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

      // =================================================
      // VALIDATE CUSTOMER ID
      // =================================================

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
      // AVAILABLE PRODUCTS
      // =================================================
      //
      // IMPORTANT:
      // Previously only Frame was allowed.
      //
      // Now Frame + Sunglass are returned.
      //
      // We keep response key "frames" so existing
      // frontend styling/functionality remains compatible.
      //
      // =================================================

      const [frames] =
        await db.query(
          `
          SELECT
            p.id,
            p.product_type,
            p.product_name,
            p.selling_price,
            p.product_image,
            p.shop_location,
            p.description,

            COALESCE(
              i.current_stock,
              0
            ) AS current_stock,

            COALESCE(
              i.low_stock_limit,
              0
            ) AS low_stock_limit

          FROM products p

          LEFT JOIN inventory i
            ON p.id = i.product_id

          WHERE
            LOWER(
              TRIM(
                p.product_type
              )
            ) IN (
              'frame',
              'sunglass',
              'sunglasses'
            )

            AND p.is_active = TRUE

            AND COALESCE(
              i.current_stock,
              0
            ) > 0

          ORDER BY
            p.product_type ASC,
            p.product_name ASC
          `
        );

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        customer:
          customers[0],

        latestEyeTest:
          eyeTests.length > 0
            ? eyeTests[0]
            : null,

        frames,
      });
    } catch (error) {
      console.error(
        "Customer Sales Info Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch customer sales information",
        error:
          error.message,
        sqlMessage:
          error.sqlMessage || null,
        code:
          error.code || null,
      });
    }
  };

// =====================================================
// CREATE SALE
// POST /api/sales
// =====================================================

export const createSale = async (
  req,
  res
) => {
  let connection = null;

  try {
    // =================================================
    // GET CONNECTION
    // =================================================

    connection =
      await db.getConnection();

    // =================================================
    // REQUEST DATA
    // =================================================

    const {
      customer_id,
      eye_test_id,

      lens_type_id,
      lens_type_name,
      lens_price,

      frame_product_id,
      frame_name,
      frame_price,

      discount_percent = 0,

      gst_enabled = false,
      gst_percent = 0,

      payment_status = "PENDING",
      payment_method,

      notes,
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
    // DISCOUNT
    // =================================================

    const discount =
      toNumber(
        discount_percent
      );

    if (
      !ALLOWED_DISCOUNTS.includes(
        discount
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount must be 0, 5, 10, 15, 20, 25 or 30",
      });
    }

    // =================================================
    // GST
    // =================================================

    const gstEnabled =
      gst_enabled === true ||
      gst_enabled === 1 ||
      gst_enabled === "true";

    const gst =
      toNumber(
        gst_percent
      );

    if (
      gstEnabled &&
      (
        !Number.isFinite(
          gst
        ) ||
        gst < 0 ||
        gst > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid GST percentage",
      });
    }

    // =================================================
    // PRICES
    // =================================================

    let lensPrice =
      toNumber(
        lens_price
      );

    let framePrice =
      toNumber(
        frame_price
      );

    if (
      !Number.isFinite(
        lensPrice
      ) ||
      lensPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid lens price",
      });
    }

    if (
      !Number.isFinite(
        framePrice
      ) ||
      framePrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid frame price",
      });
    }

    // =================================================
    // PAYMENT STATUS
    // =================================================

    const finalPaymentStatus =
      normalizePaymentStatus(
        payment_status
      );

    // =================================================
    // IDS
    // =================================================

    const finalEyeTestId =
      eye_test_id
        ? Number(eye_test_id)
        : null;

    const frameProductId =
      frame_product_id
        ? Number(
            frame_product_id
          )
        : null;

    const finalLensTypeId =
      lens_type_id
        ? Number(
            lens_type_id
          )
        : null;

    // =================================================
    // VALIDATE EYE TEST ID
    // =================================================

    if (
      finalEyeTestId !== null &&
      (
        !Number.isInteger(
          finalEyeTestId
        ) ||
        finalEyeTestId <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid eye test ID",
      });
    }

    // =================================================
    // VALIDATE LENS TYPE ID
    // =================================================

    if (
      finalLensTypeId !== null &&
      (
        !Number.isInteger(
          finalLensTypeId
        ) ||
        finalLensTypeId <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid lens type ID",
      });
    }

    // =================================================
    // VALIDATE PRODUCT ID
    // =================================================

    if (
      frameProductId !== null &&
      (
        !Number.isInteger(
          frameProductId
        ) ||
        frameProductId <= 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID",
      });
    }

    // =================================================
    // START TRANSACTION
    // =================================================

    await connection.beginTransaction();

    // =================================================
    // CUSTOMER CHECK
    // =================================================

    const [customers] =
      await connection.query(
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
      customers.length === 0
    ) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message:
          "Customer not found",
      });
    }

    // =================================================
    // LENS INFORMATION
    // =================================================

    let finalLensName =
      lens_type_name
        ? String(
            lens_type_name
          ).trim()
        : null;

    // =================================================
    // EYE TEST CHECK
    // =================================================

    if (
      finalEyeTestId !== null
    ) {
      const [eyeTests] =
        await connection.query(
          `
          SELECT
            id,
            customer_id,
            lens_type_id,
            lens_type_name,
            lens_price,
            frame_product_id,
            frame_name,
            frame_price
          FROM eye_tests
          WHERE id = ?
          LIMIT 1
          `,
          [finalEyeTestId]
        );

      if (
        eyeTests.length === 0
      ) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Eye test not found",
        });
      }

      if (
        Number(
          eyeTests[0].customer_id
        ) !== customerId
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Eye test does not belong to selected customer",
        });
      }

      if (
        !finalLensName
      ) {
        finalLensName =
          eyeTests[0]
            .lens_type_name ||
          null;
      }
    }

    // =================================================
    // LENS TYPE CHECK
    // =================================================

    if (
      finalLensTypeId !== null
    ) {
      const [lensTypes] =
        await connection.query(
          `
          SELECT
            id,
            name
          FROM lens_types
          WHERE id = ?
          LIMIT 1
          `,
          [finalLensTypeId]
        );

      if (
        lensTypes.length === 0
      ) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Lens type not found",
        });
      }

      if (
        !finalLensName
      ) {
        finalLensName =
          lensTypes[0].name;
      }
    }

    // =================================================
    // PRODUCT INFORMATION
    // =================================================

    let finalFrameName =
      frame_name
        ? String(
            frame_name
          ).trim()
        : null;

    let selectedProductType =
      null;

    // =================================================
    // REAL PRODUCT
    // =================================================

    if (
      frameProductId !== null
    ) {
      const [products] =
        await connection.query(
          `
          SELECT
            p.id,
            p.product_type,
            p.product_name,
            p.selling_price,
            p.product_image,

            COALESCE(
              i.current_stock,
              0
            ) AS current_stock

          FROM products p

          LEFT JOIN inventory i
            ON p.id = i.product_id

          WHERE
            p.id = ?

            AND LOWER(
              TRIM(
                p.product_type
              )
            ) IN (
              'frame',
              'sunglass',
              'sunglasses'
            )

            AND p.is_active = TRUE

          LIMIT 1

          FOR UPDATE
          `,
          [frameProductId]
        );

      if (
        products.length === 0
      ) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Selected product not found",
        });
      }

      const product =
        products[0];

      selectedProductType =
        product.product_type;

      // =================================================
      // STOCK CHECK
      // =================================================

      if (
        Number(
          product.current_stock
        ) < 1
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Selected product is out of stock",
        });
      }

      // =================================================
      // ALWAYS USE PRODUCT PRICE
      // =================================================

      framePrice =
        toNumber(
          product.selling_price
        );

      finalFrameName =
        product.product_name;
    }

    // =================================================
    // MANUAL FRAME
    // =================================================

    if (
      frameProductId === null &&
      framePrice > 0 &&
      !finalFrameName
    ) {
      finalFrameName =
        "Manual Frame";
    }

    // =================================================
    // AT LEAST ONE ITEM
    // =================================================

    if (
      lensPrice <= 0 &&
      framePrice <= 0
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "At least one lens or frame is required",
      });
    }

    // =================================================
    // CALCULATIONS
    // =================================================

    const subtotal =
      Number(
        (
          lensPrice +
          framePrice
        ).toFixed(2)
      );

    const discountAmount =
      Number(
        (
          subtotal *
          discount /
          100
        ).toFixed(2)
      );

    const taxableAmount =
      Number(
        (
          subtotal -
          discountAmount
        ).toFixed(2)
      );

    const gstAmount =
      gstEnabled
        ? Number(
            (
              taxableAmount *
              gst /
              100
            ).toFixed(2)
          )
        : 0;

    const grandTotal =
      Number(
        (
          taxableAmount +
          gstAmount
        ).toFixed(2)
      );

    // =================================================
    // CREATE SALE
    // =================================================

    const [saleResult] =
      await connection.query(
        `
        INSERT INTO sales
        (
          customer_id,
          eye_test_id,

          subtotal,

          discount_percent,
          discount_amount,

          gst_enabled,
          gst_percent,
          gst_amount,

          grand_total,

          payment_status,
          payment_method,

          notes
        )

        VALUES
        (
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
          ?,

          ?
        )
        `,
        [
          customerId,
          finalEyeTestId,

          subtotal,

          discount,
          discountAmount,

          gstEnabled,
          gstEnabled
            ? gst
            : 0,
          gstAmount,

          grandTotal,

          finalPaymentStatus,
          payment_method
            ? String(
                payment_method
              ).trim()
            : null,

          notes
            ? String(
                notes
              ).trim()
            : null,
        ]
      );

    const saleId =
      saleResult.insertId;

    if (!saleId) {
      throw new Error(
        "Sale could not be created"
      );
    }

    // =================================================
    // LENS SALE ITEM
    // =================================================

    if (
      lensPrice > 0
    ) {
      await connection.query(
        `
        INSERT INTO sale_items
        (
          sale_id,
          item_type,
          product_id,
          item_name,
          quantity,
          unit_price,
          total_price
        )

        VALUES
        (
          ?,
          'LENS',
          NULL,
          ?,
          1,
          ?,
          ?
        )
        `,
        [
          saleId,

          finalLensName ||
            "Custom Lens",

          lensPrice,

          lensPrice,
        ]
      );
    }

    // =================================================
    // PRODUCT SALE ITEM
    // =================================================
    //
    // We keep item_type = FRAME so the existing
    // frontend/database functionality remains compatible.
    //
    // It can now represent Frame OR Sunglass.
    //
    // =================================================

    if (
      framePrice > 0
    ) {
      await connection.query(
        `
        INSERT INTO sale_items
        (
          sale_id,
          item_type,
          product_id,
          item_name,
          quantity,
          unit_price,
          total_price
        )

        VALUES
        (
          ?,
          'FRAME',
          ?,
          ?,
          1,
          ?,
          ?
        )
        `,
        [
          saleId,

          frameProductId,

          finalFrameName ||
            "Manual Frame",

          framePrice,

          framePrice,
        ]
      );
    }

    // =================================================
    // REDUCE REAL PRODUCT STOCK
    // =================================================

    if (
      frameProductId !== null
    ) {
      const [
        stockResult,
      ] =
        await connection.query(
          `
          UPDATE inventory

          SET
            sold_quantity =
              sold_quantity + 1,

            current_stock =
              current_stock - 1

          WHERE
            product_id = ?

            AND current_stock > 0
          `,
          [
            frameProductId,
          ]
        );

      if (
        stockResult.affectedRows === 0
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            "Unable to reduce product stock",
        });
      }

      // =================================================
      // INVENTORY MOVEMENT
      // =================================================

      try {
        await connection.query(
          `
          INSERT INTO inventory_movements
          (
            product_id,
            movement_type,
            quantity,
            reference_id,
            reference_type,
            notes
          )

          VALUES
          (
            ?,
            'SALE',
            -1,
            ?,
            'SALE',
            ?
          )
          `,
          [
            frameProductId,

            saleId,

            selectedProductType
              ? `${selectedProductType} sold`
              : "Product sold",
          ]
        );
      } catch (
        movementError
      ) {
        console.warn(
          "Inventory movement was not recorded:",
          movementError.message
        );
      }
    }

    // =================================================
    // COMMIT
    // =================================================

    await connection.commit();

    // =================================================
    // FETCH CREATED SALE
    // =================================================

    const [saleRows] =
      await db.query(
        `
        SELECT
          s.id,
          s.customer_id,

          c.name AS customer_name,
          c.mobile AS customer_mobile,

          s.eye_test_id,

          s.subtotal,

          s.discount_percent,
          s.discount_amount,

          s.gst_enabled,
          s.gst_percent,
          s.gst_amount,

          s.grand_total,

          s.payment_status,
          s.payment_method,

          s.sale_date,
          s.created_at,

          s.notes

        FROM sales s

        LEFT JOIN customers c
          ON c.id =
             s.customer_id

        WHERE s.id = ?

        LIMIT 1
        `,
        [saleId]
      );

    const [items] =
      await db.query(
        `
        SELECT
          id,
          sale_id,
          item_type,
          product_id,
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

    // =================================================
    // SUCCESS RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,

      message:
        "Sale created successfully",

      sale:
        saleRows[0] || null,

      items,

      calculation: {
        subtotal,

        discount_percent:
          discount,

        discount_amount:
          discountAmount,

        taxable_amount:
          taxableAmount,

        gst_enabled:
          gstEnabled,

        gst_percent:
          gstEnabled
            ? gst
            : 0,

        gst_amount:
          gstAmount,

        grand_total:
          grandTotal,
      },
    });
  } catch (error) {
    // =================================================
    // ROLLBACK
    // =================================================

    if (connection) {
      try {
        await connection.rollback();
      } catch (
        rollbackError
      ) {
        console.error(
          "Rollback Error:",
          rollbackError
        );
      }
    }

    // =================================================
    // LOG
    // =================================================

    console.error(
      "Create Sale Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
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
    // =================================================
    // RELEASE
    // =================================================

    if (connection) {
      connection.release();
    }
  }
};

// =====================================================
// GET ALL SALES
// GET /api/sales
// =====================================================

export const getSales = async (
  req,
  res
) => {
  try {
    const [sales] =
      await db.query(
        `
        SELECT
          s.id,
          s.customer_id,

          c.name AS customer_name,
          c.mobile AS customer_mobile,

          s.eye_test_id,

          s.subtotal,

          s.discount_percent,
          s.discount_amount,

          s.gst_enabled,
          s.gst_percent,
          s.gst_amount,

          s.grand_total,

          s.payment_status,
          s.payment_method,

          s.sale_date,
          s.notes,
          s.created_at

        FROM sales s

        LEFT JOIN customers c
          ON s.customer_id =
             c.id

        ORDER BY
          s.sale_date DESC,
          s.id DESC
        `
      );

    return res.status(200).json({
      success: true,
      count: sales.length,
      sales,
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
      error:
        error.message,
      sqlMessage:
        error.sqlMessage ||
        null,
      code:
        error.code ||
        null,
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

      const [sales] =
        await db.query(
          `
          SELECT
            s.id,
            s.customer_id,

            c.name AS customer_name,
            c.mobile AS customer_mobile,

            s.eye_test_id,

            s.subtotal,

            s.discount_percent,
            s.discount_amount,

            s.gst_enabled,
            s.gst_percent,
            s.gst_amount,

            s.grand_total,

            s.payment_status,
            s.payment_method,

            s.sale_date,
            s.created_at,

            s.notes

          FROM sales s

          LEFT JOIN customers c
            ON c.id =
               s.customer_id

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
      // SALE ITEMS
      // =================================================

      const [items] =
        await db.query(
          `
          SELECT
            id,
            sale_id,
            item_type,
            product_id,
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

      return res.status(200).json({
        success: true,

        sale:
          sales[0],

        items,
      });
    } catch (error) {
      console.error(
        "Get Sale Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch sale",
        error:
          error.message,
        sqlMessage:
          error.sqlMessage ||
          null,
        code:
          error.code ||
          null,
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

      const {
        payment_status,
        payment_method,
      } = req.body;

      const status =
        normalizePaymentStatus(
          payment_status
        );

      const [result] =
        await db.query(
          `
          UPDATE sales

          SET
            payment_status = ?,
            payment_method = ?

          WHERE id = ?
          `,
          [
            status,

            payment_method
              ? String(
                  payment_method
                ).trim()
              : null,

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
      });
    } catch (error) {
      console.error(
        "Update Payment Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update payment status",
        error:
          error.message,
        sqlMessage:
          error.sqlMessage ||
          null,
        code:
          error.code ||
          null,
      });
    }
  };