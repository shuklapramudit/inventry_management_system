import db from "../config/db.js";

// =====================================================
// SALES SERVICE
// =====================================================
// All sales related database operations are handled here.
// =====================================================


// =====================================================
// CONSTANTS
// =====================================================

export const ALLOWED_DISCOUNTS = [
  0,
  5,
  10,
  15,
  20,
  25,
  30,
];


// =====================================================
// NUMBER HELPER
// =====================================================

export const toNumber = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};


// =====================================================
// ERROR HELPER
// =====================================================

const createServiceError = (
  message,
  statusCode = 400
) => {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
};


// =====================================================
// GET SALES CUSTOMERS
// =====================================================
// GET /api/sales/customers
// =====================================================

export const getSalesCustomersService = async () => {
  const [customers] = await db.query(`
    SELECT
      id,
      name,
      mobile
    FROM customers
    ORDER BY name ASC
  `);

  return customers;
};


// =====================================================
// GET CUSTOMER SALES INFORMATION
// =====================================================
// GET /api/sales/customer/:customerId
// =====================================================

export const getCustomerSalesInfoService = async (
  customerId
) => {

  // ---------------------------------------------------
  // CUSTOMER
  // ---------------------------------------------------

  const [customers] = await db.query(
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


  if (customers.length === 0) {
    return null;
  }


  // ---------------------------------------------------
  // LATEST EYE TEST
  // ---------------------------------------------------

  const [eyeTests] = await db.query(
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


  // ---------------------------------------------------
  // AVAILABLE FRAMES
  // ---------------------------------------------------

  const [frames] = await db.query(`
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
      p.product_type = 'Frame'
      AND p.is_active = TRUE
      AND COALESCE(i.current_stock, 0) > 0

    ORDER BY p.product_name ASC
  `);


  // ---------------------------------------------------
  // RETURN
  // ---------------------------------------------------

  return {
    customer: customers[0],

    latestEyeTest:
      eyeTests.length > 0
        ? eyeTests[0]
        : null,

    frames,
  };
};


// =====================================================
// CREATE SALE
// =====================================================
// POST /api/sales
// =====================================================

export const createSaleService = async ({
  customerId,
  finalEyeTestId = null,

  finalLensTypeId = null,
  lens_type_name = null,
  lensPrice = 0,

  frameProductId = null,
  frame_name = null,
  framePrice = 0,

  discount = 0,

  gstEnabled = false,
  gst = 0,

  advanceAmount = 0,

  payment_status = "PENDING",
  payment_method = null,

  notes = null,
}) => {

  // ===================================================
  // BASIC VALIDATION
  // ===================================================

  if (
    !Number.isInteger(customerId) ||
    customerId <= 0
  ) {
    throw createServiceError(
      "Invalid customer ID"
    );
  }


  if (
    !ALLOWED_DISCOUNTS.includes(
      Number(discount)
    )
  ) {
    throw createServiceError(
      "Invalid discount percentage"
    );
  }


  if (
    !Number.isFinite(lensPrice) ||
    lensPrice < 0
  ) {
    throw createServiceError(
      "Invalid lens price"
    );
  }


  if (
    !Number.isFinite(framePrice) ||
    framePrice < 0
  ) {
    throw createServiceError(
      "Invalid frame price"
    );
  }


  if (
    !Number.isFinite(advanceAmount) ||
    advanceAmount < 0
  ) {
    throw createServiceError(
      "Invalid advance amount"
    );
  }


  // ===================================================
  // NORMALIZE VALUES
  // ===================================================

  const finalDiscount =
    Number(discount);

  const finalGST =
    gstEnabled
      ? Number(gst)
      : 0;

  const finalAdvance =
    Number(advanceAmount);


  // ===================================================
  // START TRANSACTION
  // ===================================================

  const connection =
    await db.getConnection();

  try {

    await connection.beginTransaction();


    // =================================================
    // CHECK CUSTOMER
    // =================================================

    const [customers] =
      await connection.query(
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
        FOR UPDATE
        `,
        [customerId]
      );


    if (customers.length === 0) {

      throw createServiceError(
        "Customer not found",
        404
      );

    }


    // =================================================
    // CHECK EYE TEST
    // =================================================

    if (finalEyeTestId !== null) {

      const [eyeTests] =
        await connection.query(
          `
          SELECT
            id,
            customer_id
          FROM eye_tests
          WHERE id = ?
          LIMIT 1
          `,
          [finalEyeTestId]
        );


      if (eyeTests.length === 0) {

        throw createServiceError(
          "Eye test not found",
          404
        );

      }


      if (
        Number(
          eyeTests[0].customer_id
        ) !== customerId
      ) {

        throw createServiceError(
          "Eye test does not belong to selected customer"
        );

      }

    }


    // =================================================
    // CHECK LENS TYPE
    // =================================================

    if (finalLensTypeId !== null) {

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


      if (lensTypes.length === 0) {

        throw createServiceError(
          "Lens type not found",
          404
        );

      }

    }


    // =================================================
    // CHECK FRAME + STOCK
    // =================================================

    let selectedFrame = null;
    let inventoryRow = null;


    if (frameProductId !== null) {

      const [frames] =
        await connection.query(
          `
          SELECT
            id,
            product_type,
            product_name,
            selling_price,
            product_image,
            is_active
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [frameProductId]
        );


      if (frames.length === 0) {

        throw createServiceError(
          "Frame product not found",
          404
        );

      }


      selectedFrame = frames[0];


      if (
        selectedFrame.is_active !== 1 &&
        selectedFrame.is_active !== true
      ) {

        throw createServiceError(
          "Selected frame is inactive"
        );

      }


      if (
        String(
          selectedFrame.product_type
        ).toLowerCase() !== "frame"
      ) {

        throw createServiceError(
          "Selected product is not a frame"
        );

      }


      // -----------------------------------------------
      // LOCK INVENTORY ROW
      // -----------------------------------------------

      const [inventoryRows] =
        await connection.query(
          `
          SELECT
            id,
            product_id,
            current_stock,
            low_stock_limit
          FROM inventory
          WHERE product_id = ?
          LIMIT 1
          FOR UPDATE
          `,
          [frameProductId]
        );


      if (inventoryRows.length === 0) {

        throw createServiceError(
          "Inventory record not found for selected frame"
        );

      }


      inventoryRow =
        inventoryRows[0];


      const currentStock =
        Number(
          inventoryRow.current_stock
        );


      if (
        !Number.isFinite(currentStock) ||
        currentStock <= 0
      ) {

        throw createServiceError(
          "Selected frame is out of stock"
        );

      }

    }


    // =================================================
    // DETERMINE ITEM NAMES
    // =================================================

    let finalFrameName =
      frame_name || null;

    let finalLensName =
      lens_type_name || null;


    // Use DB frame name if frontend didn't send name

    if (
      frameProductId !== null &&
      !finalFrameName
    ) {

      finalFrameName =
        selectedFrame.product_name;

    }


    // Use DB lens name if frontend didn't send name

    if (
      finalLensTypeId !== null &&
      !finalLensName
    ) {

      const [lensRows] =
        await connection.query(
          `
          SELECT
            name
          FROM lens_types
          WHERE id = ?
          LIMIT 1
          `,
          [finalLensTypeId]
        );


      if (lensRows.length > 0) {

        finalLensName =
          lensRows[0].name;

      }

    }


    // =================================================
    // CALCULATE SUBTOTAL
    // =================================================

    const subtotal =
      Number(lensPrice) +
      Number(framePrice);


    if (
      subtotal <= 0
    ) {

      throw createServiceError(
        "Sale must contain at least one item"
      );

    }


    // =================================================
    // DISCOUNT
    // =================================================

    const discountAmount =
      Number(
        (
          subtotal *
          finalDiscount /
          100
        ).toFixed(2)
      );


    const amountAfterDiscount =
      Number(
        (
          subtotal -
          discountAmount
        ).toFixed(2)
      );


    // =================================================
    // GST
    // =================================================

    const gstAmount =
      gstEnabled
        ? Number(
            (
              amountAfterDiscount *
              finalGST /
              100
            ).toFixed(2)
          )
        : 0;


    // =================================================
    // GRAND TOTAL
    // =================================================

    const grandTotal =
      Number(
        (
          amountAfterDiscount +
          gstAmount
        ).toFixed(2)
      );


    // =================================================
    // VALIDATE ADVANCE
    // =================================================

    if (
      finalAdvance > grandTotal
    ) {

      throw createServiceError(
        "Advance amount cannot be greater than grand total"
      );

    }


    // =================================================
    // PAYMENT STATUS
    // =================================================

    let finalPaymentStatus =
      String(
        payment_status || "PENDING"
      ).toUpperCase();


    const allowedPaymentStatuses = [
      "PENDING",
      "PARTIAL",
      "PAID",
    ];


    if (
      !allowedPaymentStatuses.includes(
        finalPaymentStatus
      )
    ) {

      finalPaymentStatus =
        "PENDING";

    }


    // Automatically correct payment status

    if (
      grandTotal > 0 &&
      finalAdvance >= grandTotal
    ) {

      finalPaymentStatus =
        "PAID";

    } else if (
      finalAdvance > 0
    ) {

      finalPaymentStatus =
        "PARTIAL";

    }


    // =================================================
    // INSERT SALE
    // =================================================

    const [saleResult] =
      await connection.query(
        `
        INSERT INTO sales (
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

          advance_amount,

          sale_date,
          notes
        )
        VALUES (
          ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?,
          ?, ?,
          ?,
          NOW(),
          ?
        )
        `,
        [
          customerId,
          finalEyeTestId,

          subtotal,
          finalDiscount,
          discountAmount,

          gstEnabled ? 1 : 0,
          finalGST,
          gstAmount,

          grandTotal,

          finalPaymentStatus,
          payment_method || null,

          finalAdvance,

          notes || null,
        ]
      );


    const saleId =
      saleResult.insertId;


    // =================================================
    // INSERT SALE ITEMS
    // =================================================

    const saleItems = [];


    // -------------------------------------------------
    // LENS ITEM
    // -------------------------------------------------

    if (
      Number(lensPrice) > 0
    ) {

      const [lensItemResult] =
        await connection.query(
          `
          INSERT INTO sale_items (
            sale_id,
            item_type,
            product_id,
            item_name,
            quantity,
            unit_price,
            total_price
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            saleId,
            "LENS",
            null,
            finalLensName || "Lens",
            1,
            Number(lensPrice),
            Number(lensPrice),
          ]
        );


      saleItems.push({
        id:
          lensItemResult.insertId,

        sale_id:
          saleId,

        item_type:
          "LENS",

        product_id:
          null,

        item_name:
          finalLensName || "Lens",

        quantity:
          1,

        unit_price:
          Number(lensPrice),

        total_price:
          Number(lensPrice),
      });

    }


    // -------------------------------------------------
    // FRAME ITEM
    // -------------------------------------------------

    if (
      frameProductId !== null &&
      Number(framePrice) > 0
    ) {

      const [frameItemResult] =
        await connection.query(
          `
          INSERT INTO sale_items (
            sale_id,
            item_type,
            product_id,
            item_name,
            quantity,
            unit_price,
            total_price
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            saleId,
            "FRAME",
            frameProductId,
            finalFrameName || "Frame",
            1,
            Number(framePrice),
            Number(framePrice),
          ]
        );


      saleItems.push({
        id:
          frameItemResult.insertId,

        sale_id:
          saleId,

        item_type:
          "FRAME",

        product_id:
          frameProductId,

        item_name:
          finalFrameName || "Frame",

        quantity:
          1,

        unit_price:
          Number(framePrice),

        total_price:
          Number(framePrice),
      });


      // -----------------------------------------------
      // REDUCE FRAME INVENTORY
      // -----------------------------------------------

      const currentStock =
        Number(
          inventoryRow.current_stock
        );


      const newStock =
        currentStock - 1;


      await connection.query(
        `
        UPDATE inventory
        SET
          current_stock = ?
        WHERE product_id = ?
        `,
        [
          newStock,
          frameProductId,
        ]
      );


      // -----------------------------------------------
      // UPDATE PRODUCT STOCK
      // -----------------------------------------------
      // Keep products.stock_quantity synchronized
      // with inventory.current_stock.
      // -----------------------------------------------

      await connection.query(
        `
        UPDATE products
        SET
          stock_quantity = ?
        WHERE id = ?
        `,
        [
          newStock,
          frameProductId,
        ]
      );


      // -----------------------------------------------
      // INVENTORY MOVEMENT
      // -----------------------------------------------
      // Try to create movement record.
      //
      // If inventory_movements has a different schema,
      // the sale itself should not be broken by this
      // optional history insert.
      // -----------------------------------------------

      try {

        await connection.query(
          `
          INSERT INTO inventory_movements (
            product_id,
            movement_type,
            quantity,
            reference_type,
            reference_id
          )
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            frameProductId,
            "SALE",
            1,
            "SALE",
            saleId,
          ]
        );

      } catch (movementError) {

        console.warn(
          "Inventory movement history was not recorded:",
          movementError.message
        );

      }

    }


    // =================================================
    // FETCH CREATED SALE
    // =================================================

    const [createdSales] =
      await connection.query(
        `
        SELECT
          s.id,
          s.customer_id,

          c.name AS customer_name,
          c.mobile AS customer_mobile,
          c.email AS customer_email,

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

          s.advance_amount,

          s.sale_date,
          s.created_at,
          s.notes

        FROM sales s

        LEFT JOIN customers c
          ON c.id = s.customer_id

        WHERE s.id = ?

        LIMIT 1
        `,
        [saleId]
      );


    // =================================================
    // COMMIT
    // =================================================

    await connection.commit();


    // =================================================
    // RETURN
    // =================================================

    return {

      sale:
        createdSales[0],

      items:
        saleItems,

      calculation: {

        subtotal,

        discount_percent:
          finalDiscount,

        discount_amount:
          discountAmount,

        gst_enabled:
          gstEnabled,

        gst_percent:
          finalGST,

        gst_amount:
          gstAmount,

        grand_total:
          grandTotal,

        advance_amount:
          finalAdvance,

        balance_amount:
          Number(
            (
              grandTotal -
              finalAdvance
            ).toFixed(2)
          ),

      },

    };

  } catch (error) {

    // =================================================
    // ROLLBACK
    // =================================================

    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "Rollback Error:",
        rollbackError
      );
    }


    throw error;

  } finally {

    // =================================================
    // RELEASE CONNECTION
    // =================================================

    connection.release();

  }
};


// =====================================================
// GET ALL SALES
// =====================================================
// GET /api/sales
// =====================================================

export const getAllSalesService = async () => {

  const [sales] = await db.query(
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

      s.advance_amount,

      s.sale_date,
      s.notes,
      s.created_at

    FROM sales s

    INNER JOIN customers c
      ON s.customer_id = c.id

    ORDER BY
      s.sale_date DESC,
      s.id DESC
    `
  );

  return sales;
};


// =====================================================
// GET SALE BY ID
// =====================================================
// GET /api/sales/:id
// =====================================================

export const getSaleByIdService = async (
  saleId
) => {

  const [sales] =
    await db.query(
      `
      SELECT
        s.id,
        s.customer_id,

        c.name AS customer_name,
        c.mobile AS customer_mobile,
        c.email AS customer_email,
        c.address AS customer_address,
        c.city AS customer_city,
        c.state AS customer_state,
        c.pincode AS customer_pincode,

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

        s.advance_amount,

        s.sale_date,
        s.created_at,
        s.notes

      FROM sales s

      LEFT JOIN customers c
        ON c.id = s.customer_id

      WHERE s.id = ?

      LIMIT 1
      `,
      [saleId]
    );


  if (
    sales.length === 0
  ) {
    return null;
  }


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


  return {
    sale:
      sales[0],

    items,
  };
};


// =====================================================
// UPDATE PAYMENT STATUS
// =====================================================
// PATCH /api/sales/:id/payment
// =====================================================

export const updatePaymentStatusService = async (
  saleId,
  paymentStatus,
  paymentMethod = null
) => {

  // ===================================================
  // VALIDATE SALE ID
  // ===================================================

  if (
    !Number.isInteger(
      Number(saleId)
    ) ||
    Number(saleId) <= 0
  ) {

    throw createServiceError(
      "Invalid sale ID"
    );

  }


  // ===================================================
  // VALIDATE PAYMENT STATUS
  // ===================================================

  const allowedStatuses = [
    "PENDING",
    "PARTIAL",
    "PAID",
  ];


  const finalStatus =
    String(
      paymentStatus || ""
    ).toUpperCase();


  if (
    !allowedStatuses.includes(
      finalStatus
    )
  ) {

    throw createServiceError(
      "Invalid payment status. Allowed values are PENDING, PARTIAL and PAID."
    );

  }


  // ===================================================
  // CHECK SALE
  // ===================================================

  const [sales] =
    await db.query(
      `
      SELECT
        id
      FROM sales
      WHERE id = ?
      LIMIT 1
      `,
      [saleId]
    );


  if (
    sales.length === 0
  ) {

    return false;

  }


  // ===================================================
  // UPDATE PAYMENT
  // ===================================================

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
        finalStatus,
        paymentMethod || null,
        saleId,
      ]
    );


  return result.affectedRows > 0;
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {

  ALLOWED_DISCOUNTS,

  toNumber,

  getSalesCustomersService,

  getCustomerSalesInfoService,

  createSaleService,

  getAllSalesService,

  getSaleByIdService,

  updatePaymentStatusService,

};