import db from "../config/db.js";

// =====================================================
// COMMON HELPERS
// =====================================================

const isPositiveInteger = (value) => {
  return (
    Number.isInteger(Number(value)) &&
    Number(value) > 0
  );
};

const toNullableNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const toPrice = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return 0;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
};

// =====================================================
// GET ALL EYE TESTS
// GET /api/eye-tests
// =====================================================

export const getEyeTests = async (
  req,
  res
) => {
  try {
    const [tests] = await db.query(`
      SELECT
        et.id,
        et.customer_id,

        c.name AS customer_name,
        c.mobile AS customer_mobile,

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

        et.test_date,
        et.notes,
        et.created_at,
        et.updated_at

      FROM eye_tests et

      INNER JOIN customers c
        ON et.customer_id = c.id

      LEFT JOIN lens_types lt
        ON et.lens_type_id = lt.id

      ORDER BY
        et.test_date DESC,
        et.id DESC
    `);

    return res.status(200).json({
      success: true,
      count: tests.length,
      eyeTests: tests,
    });

  } catch (error) {
    console.error(
      "Get Eye Tests Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch eye tests",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

// =====================================================
// GET SINGLE EYE TEST
// GET /api/eye-tests/:id
// =====================================================

export const getEyeTestById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid eye test ID",
      });
    }

    const [tests] =
      await db.query(
        `
        SELECT
          et.id,
          et.customer_id,

          c.name AS customer_name,
          c.mobile AS customer_mobile,

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

          et.test_date,
          et.notes,
          et.created_at,
          et.updated_at

        FROM eye_tests et

        INNER JOIN customers c
          ON et.customer_id = c.id

        LEFT JOIN lens_types lt
          ON et.lens_type_id = lt.id

        WHERE et.id = ?

        LIMIT 1
        `,
        [id]
      );

    if (tests.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Eye test not found",
      });
    }

    return res.status(200).json({
      success: true,
      eyeTest: tests[0],
    });

  } catch (error) {
    console.error(
      "Get Eye Test By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch eye test",
    });
  }
};

// =====================================================
// GET EYE TESTS BY CUSTOMER
// GET /api/eye-tests/customer/:customerId
// =====================================================

export const getEyeTestsByCustomer =
  async (
    req,
    res
  ) => {
    try {
      const { customerId } =
        req.params;

      if (
        !isPositiveInteger(
          customerId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid customer ID",
        });
      }

      const [customers] =
        await db.query(
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
        return res.status(404).json({
          success: false,
          message:
            "Customer not found",
        });
      }

      const [tests] =
        await db.query(
          `
          SELECT
            et.id,
            et.customer_id,

            c.name AS customer_name,
            c.mobile AS customer_mobile,

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

            et.test_date,
            et.notes

          FROM eye_tests et

          INNER JOIN customers c
            ON et.customer_id = c.id

          LEFT JOIN lens_types lt
            ON et.lens_type_id = lt.id

          WHERE et.customer_id = ?

          ORDER BY
            et.test_date DESC,
            et.id DESC
          `,
          [customerId]
        );

      return res.status(200).json({
        success: true,
        customer:
          customers[0],
        count: tests.length,
        eyeTests: tests,
        latestEyeTest:
          tests.length > 0
            ? tests[0]
            : null,
      });

    } catch (error) {
      console.error(
        "Get Customer Eye Tests Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch customer eye tests",
      });
    }
  };

// =====================================================
// GET CUSTOMERS
// GET /api/eye-tests/customers
// =====================================================

export const getCustomersForEyeTest =
  async (
    req,
    res
  ) => {
    try {
      const [customers] =
        await db.query(`
          SELECT
            id,
            name,
            mobile
          FROM customers
          ORDER BY name ASC
        `);

      return res.status(200).json({
        success: true,
        count: customers.length,
        customers,
      });

    } catch (error) {
      console.error(
        "Get Eye Test Customers Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch customers",
      });
    }
  };

// =====================================================
// GET LENS TYPES
// GET /api/eye-tests/lens-types
// =====================================================

export const getLensTypes =
  async (
    req,
    res
  ) => {
    try {
      const [lensTypes] =
        await db.query(`
          SELECT
            id,
            name,
            description
          FROM lens_types
          WHERE is_active = TRUE
          ORDER BY name ASC
        `);

      return res.status(200).json({
        success: true,
        count: lensTypes.length,
        lensTypes,
      });

    } catch (error) {
      console.error(
        "Get Lens Types Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch lens types",
      });
    }
  };

// =====================================================
// GET AVAILABLE FRAMES
// GET /api/eye-tests/frames
// =====================================================
//
// IMPORTANT:
// Frame + Sunglass both supported.
// Response key remains "frames" so existing
// frontend functionality does not break.
// =====================================================

export const getFramesForEyeTest =
  async (
    req,
    res
  ) => {
    try {
      const [frames] =
        await db.query(`
          SELECT
            p.id,
            p.product_type,
            p.product_name,
            p.product_image,
            p.shop_location,
            p.description,

            COALESCE(
              p.selling_price,
              0
            ) AS selling_price,

            COALESCE(
              i.current_stock,
              0
            ) AS current_stock

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
        `);

      return res.status(200).json({
        success: true,
        count: frames.length,
        frames,
      });

    } catch (error) {
      console.error(
        "Get Eye Test Frames Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch frames",
        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// =====================================================
// CREATE MANUAL FRAME
// POST /api/eye-tests/frames
// =====================================================

export const createManualFrame =
  async (
    req,
    res
  ) => {
    const connection =
      await db.getConnection();

    try {
      const {
        product_name,
        product_image,
        shop_location,
        description,
        low_stock_limit,
        initial_stock,
        purchase_price,
        selling_price,
      } = req.body;

      if (
        !product_name ||
        !product_name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Frame name is required",
        });
      }

      const validLocations = [
        "Arjunganj",
        "Telibag",
      ];

      if (
        !validLocations.includes(
          shop_location
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Shop location must be Arjunganj or Telibag",
        });
      }

      const stock =
        initial_stock === undefined ||
        initial_stock === ""
          ? 0
          : Number(initial_stock);

      if (
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid initial stock",
        });
      }

      const lowStock =
        low_stock_limit ===
          undefined ||
        low_stock_limit === ""
          ? 5
          : Number(low_stock_limit);

      if (
        !Number.isInteger(
          lowStock
        ) ||
        lowStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid low stock limit",
        });
      }

      const purchasePrice =
        purchase_price ===
          undefined ||
        purchase_price === ""
          ? 0
          : Number(purchase_price);

      if (
        !Number.isFinite(
          purchasePrice
        ) ||
        purchasePrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid purchase price",
        });
      }

      const sellingPrice =
        selling_price ===
          undefined ||
        selling_price === ""
          ? 0
          : Number(selling_price);

      if (
        !Number.isFinite(
          sellingPrice
        ) ||
        sellingPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid selling price",
        });
      }

      await connection.beginTransaction();

      // =================================================
      // PRODUCT
      // =================================================

      const [
        productResult,
      ] =
        await connection.query(
          `
          INSERT INTO products
          (
            product_type,
            product_name,
            selling_price,
            product_image,
            shop_location,
            description,
            is_active
          )
          VALUES
          (
            'Frame',
            ?,
            ?,
            ?,
            ?,
            ?,
            TRUE
          )
          `,
          [
            product_name.trim(),
            sellingPrice,
            product_image ||
              null,
            shop_location,
            description?.trim() ||
              null,
          ]
        );

      const productId =
        productResult.insertId;

      // =================================================
      // INVENTORY
      // =================================================

      await connection.query(
        `
        INSERT INTO inventory
        (
          product_id,
          purchased_quantity,
          sold_quantity,
          current_stock,
          low_stock_limit
        )
        VALUES
        (?, ?, 0, ?, ?)
        `,
        [
          productId,
          stock,
          stock,
          lowStock,
        ]
      );

      // =================================================
      // PURCHASE HISTORY
      // =================================================

      if (stock > 0) {
        const [
          purchaseResult,
        ] =
          await connection.query(
            `
            INSERT INTO purchases
            (
              product_id,
              quantity,
              purchase_price,
              shop_location,
              purchase_date,
              notes
            )
            VALUES
            (
              ?,
              ?,
              ?,
              ?,
              CURRENT_TIMESTAMP,
              ?
            )
            `,
            [
              productId,
              stock,
              purchasePrice,
              shop_location,
              "Added through Eye Testing",
            ]
          );

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
            'PURCHASE',
            ?,
            ?,
            'EYE_TEST_FRAME',
            ?
          )
          `,
          [
            productId,
            stock,
            purchaseResult.insertId,
            "Initial stock added through Eye Testing",
          ]
        );
      }

      await connection.commit();

      // =================================================
      // RETURN CREATED FRAME
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

            i.purchased_quantity,
            i.sold_quantity,
            i.current_stock,
            i.low_stock_limit

          FROM products p

          INNER JOIN inventory i
            ON p.id = i.product_id

          WHERE p.id = ?
          `,
          [productId]
        );

      return res.status(201).json({
        success: true,
        message:
          "Frame added successfully.",
        product:
          frames[0],
      });

    } catch (error) {
      try {
        await connection.rollback();
      } catch {}

      console.error(
        "Create Manual Frame Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to add frame",
        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });

    } finally {
      connection.release();
    }
  };

// =====================================================
// CREATE EYE TEST
// POST /api/eye-tests
// =====================================================

export const createEyeTest =
  async (
    req,
    res
  ) => {
    try {
      const {
        customer_id,

        right_sph,
        right_cyl,
        right_axis,
        right_add,
        right_pd,

        left_sph,
        left_cyl,
        left_axis,
        left_add,
        left_pd,

        lens_type_id,
        lens_type_name,
        lens_price,

        frame_product_id,
        frame_name,
        frame_price,

        test_date,
        notes,
      } = req.body;

      // =================================================
      // CUSTOMER
      // =================================================

      if (
        !isPositiveInteger(
          customer_id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid customer is required",
        });
      }

      const [
        customers,
      ] = await db.query(
        `
        SELECT
          id,
          name,
          mobile
        FROM customers
        WHERE id = ?
        LIMIT 1
        `,
        [customer_id]
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
      // PRICES
      // =================================================

      const finalLensPrice =
        toPrice(lens_price);

      const finalFramePrice =
        toPrice(frame_price);

      if (
        finalLensPrice === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid lens price",
        });
      }

      if (
        finalFramePrice === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid frame price",
        });
      }

      // =================================================
      // LENS
      // =================================================

      let finalLensTypeId =
        lens_type_id
          ? Number(lens_type_id)
          : null;

      let finalLensTypeName =
        lens_type_name?.trim() ||
        null;

      if (
        finalLensTypeId
      ) {
        const [
          lensTypes,
        ] =
          await db.query(
            `
            SELECT
              id,
              name
            FROM lens_types
            WHERE
              id = ?
              AND is_active = TRUE
            LIMIT 1
            `,
            [
              finalLensTypeId,
            ]
          );

        if (
          lensTypes.length === 0
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Selected lens type not found",
          });
        }

        finalLensTypeName =
          lensTypes[0].name;
      }

      // =================================================
      // FRAME / SUNGLASS
      // =================================================

      let finalFrameProductId =
        frame_product_id
          ? Number(frame_product_id)
          : null;

      let finalFrameName =
        frame_name?.trim() ||
        null;

      if (
        finalFrameProductId
      ) {
        const [
          frames,
        ] =
          await db.query(
            `
            SELECT
              p.id,
              p.product_type,
              p.product_name,
              p.selling_price,
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
            `,
            [
              finalFrameProductId,
            ]
          );

        if (
          frames.length === 0
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Selected frame/sunglass not found",
          });
        }

        if (
          Number(
            frames[0].current_stock
          ) <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Selected frame/sunglass is out of stock",
          });
        }

        finalFrameName =
          frames[0].product_name;
      }

      // =================================================
      // INSERT
      // =================================================

      const [
        result,
      ] = await db.query(
        `
        INSERT INTO eye_tests
        (
          customer_id,

          right_sph,
          right_cyl,
          right_axis,
          right_add,
          right_pd,

          left_sph,
          left_cyl,
          left_axis,
          left_add,
          left_pd,

          lens_type_id,
          lens_type_name,
          lens_price,

          frame_product_id,
          frame_name,
          frame_price,

          test_date,
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

          ?,
          ?,
          ?,

          ?,
          ?,
          ?,

          COALESCE(
            ?,
            CURRENT_TIMESTAMP
          ),

          ?
        )
        `,
        [
          customer_id,

          toNullableNumber(
            right_sph
          ),
          toNullableNumber(
            right_cyl
          ),
          toNullableNumber(
            right_axis
          ),
          toNullableNumber(
            right_add
          ),
          toNullableNumber(
            right_pd
          ),

          toNullableNumber(
            left_sph
          ),
          toNullableNumber(
            left_cyl
          ),
          toNullableNumber(
            left_axis
          ),
          toNullableNumber(
            left_add
          ),
          toNullableNumber(
            left_pd
          ),

          finalLensTypeId,
          finalLensTypeName,
          finalLensPrice,

          finalFrameProductId,
          finalFrameName,
          finalFramePrice,

          test_date || null,
          notes?.trim() || null,
        ]
      );

      // =================================================
      // RETURN CREATED RECORD
      // =================================================

      const [
        tests,
      ] = await db.query(
        `
        SELECT
          et.id,
          et.customer_id,

          c.name AS customer_name,
          c.mobile AS customer_mobile,

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

          et.test_date,
          et.notes,
          et.created_at

        FROM eye_tests et

        INNER JOIN customers c
          ON et.customer_id = c.id

        LEFT JOIN lens_types lt
          ON et.lens_type_id = lt.id

        WHERE et.id = ?

        LIMIT 1
        `,
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message:
          "Eye test saved successfully",
        eyeTest:
          tests[0],
      });

    } catch (error) {
      console.error(
        "Create Eye Test Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to save eye test",
        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// =====================================================
// UPDATE EYE TEST
// PUT /api/eye-tests/:id
// =====================================================

export const updateEyeTest =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !isPositiveInteger(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid eye test ID",
        });
      }

      const [
        existing,
      ] = await db.query(
        `
        SELECT
          id
        FROM eye_tests
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

      if (
        existing.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Eye test not found",
        });
      }

      const {
        customer_id,

        right_sph,
        right_cyl,
        right_axis,
        right_add,
        right_pd,

        left_sph,
        left_cyl,
        left_axis,
        left_add,
        left_pd,

        lens_type_id,
        lens_type_name,
        lens_price,

        frame_product_id,
        frame_name,
        frame_price,

        test_date,
        notes,
      } = req.body;

      // =================================================
      // CUSTOMER
      // =================================================

      if (
        !isPositiveInteger(
          customer_id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid customer is required",
        });
      }

      const [
        customers,
      ] = await db.query(
        `
        SELECT
          id
        FROM customers
        WHERE id = ?
        LIMIT 1
        `,
        [customer_id]
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
      // PRICES
      // =================================================

      const finalLensPrice =
        toPrice(lens_price);

      const finalFramePrice =
        toPrice(frame_price);

      if (
        finalLensPrice === null ||
        finalFramePrice === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid lens or frame price",
        });
      }

      // =================================================
      // LENS
      // =================================================

      let finalLensTypeId =
        lens_type_id
          ? Number(lens_type_id)
          : null;

      let finalLensTypeName =
        lens_type_name?.trim() ||
        null;

      if (
        finalLensTypeId
      ) {
        const [
          lensTypes,
        ] =
          await db.query(
            `
            SELECT
              id,
              name
            FROM lens_types
            WHERE
              id = ?
              AND is_active = TRUE
            LIMIT 1
            `,
            [
              finalLensTypeId,
            ]
          );

        if (
          lensTypes.length === 0
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Lens type not found",
          });
        }

        finalLensTypeName =
          lensTypes[0].name;
      }

      // =================================================
      // FRAME / SUNGLASS
      // =================================================

      let finalFrameProductId =
        frame_product_id
          ? Number(frame_product_id)
          : null;

      let finalFrameName =
        frame_name?.trim() ||
        null;

      if (
        finalFrameProductId
      ) {
        const [
          frames,
        ] =
          await db.query(
            `
            SELECT
              p.id,
              p.product_type,
              p.product_name

            FROM products p

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
            `,
            [
              finalFrameProductId,
            ]
          );

        if (
          frames.length === 0
        ) {
          return res.status(404).json({
            success: false,
            message:
              "Frame/sunglass not found",
          });
        }

        finalFrameName =
          frames[0].product_name;
      }

      // =================================================
      // UPDATE
      // =================================================

      await db.query(
        `
        UPDATE eye_tests
        SET
          customer_id = ?,

          right_sph = ?,
          right_cyl = ?,
          right_axis = ?,
          right_add = ?,
          right_pd = ?,

          left_sph = ?,
          left_cyl = ?,
          left_axis = ?,
          left_add = ?,
          left_pd = ?,

          lens_type_id = ?,
          lens_type_name = ?,
          lens_price = ?,

          frame_product_id = ?,
          frame_name = ?,
          frame_price = ?,

          test_date = COALESCE(
            ?,
            test_date
          ),

          notes = ?

        WHERE id = ?
        `,
        [
          customer_id,

          toNullableNumber(
            right_sph
          ),
          toNullableNumber(
            right_cyl
          ),
          toNullableNumber(
            right_axis
          ),
          toNullableNumber(
            right_add
          ),
          toNullableNumber(
            right_pd
          ),

          toNullableNumber(
            left_sph
          ),
          toNullableNumber(
            left_cyl
          ),
          toNullableNumber(
            left_axis
          ),
          toNullableNumber(
            left_add
          ),
          toNullableNumber(
            left_pd
          ),

          finalLensTypeId,
          finalLensTypeName,
          finalLensPrice,

          finalFrameProductId,
          finalFrameName,
          finalFramePrice,

          test_date || null,

          notes?.trim() || null,

          id,
        ]
      );

      return res.status(200).json({
        success: true,
        message:
          "Eye test updated successfully",
      });

    } catch (error) {
      console.error(
        "Update Eye Test Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update eye test",
        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// =====================================================
// DELETE EYE TEST
// DELETE /api/eye-tests/:id
// =====================================================

export const deleteEyeTest =
  async (
    req,
    res
  ) => {
    try {
      const { id } =
        req.params;

      if (
        !isPositiveInteger(id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid eye test ID",
        });
      }

      const [
        result,
      ] = await db.query(
        `
        DELETE FROM eye_tests
        WHERE id = ?
        `,
        [id]
      );

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Eye test not found",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Eye test deleted successfully",
      });

    } catch (error) {
      console.error(
        "Delete Eye Test Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete eye test",
      });
    }
  };