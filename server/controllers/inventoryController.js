import db from "../config/db.js";


// =====================================================
// GET ALL INVENTORY
// GET /api/inventory
// =====================================================

export const getInventory = async (
  req,
  res
) => {

  try {

    const [rows] =
      await db.query(
        `
        SELECT
          i.id,
          i.product_id,

          p.product_type,
          p.product_name,
          p.selling_price,
          p.product_image,
          p.shop_location,
          p.description,
          p.is_active,

          COALESCE(
            i.purchased_quantity,
            0
          ) AS purchased_quantity,

          COALESCE(
            i.sold_quantity,
            0
          ) AS sold_quantity,

          COALESCE(
            i.current_stock,
            0
          ) AS current_stock,

          i.low_stock_limit,
          i.updated_at

        FROM inventory i

        INNER JOIN products p
          ON p.id = i.product_id

        WHERE p.is_active = 1

        ORDER BY
          i.current_stock ASC,
          p.product_name ASC
        `
      );


    const inventory =
      rows.map(
        (item) => ({

          ...item,

          id:
            Number(item.id),

          product_id:
            Number(
              item.product_id
            ),

          selling_price:
            Number(
              item.selling_price || 0
            ),

          purchased_quantity:
            Number(
              item.purchased_quantity ||
              0
            ),

          sold_quantity:
            Number(
              item.sold_quantity ||
              0
            ),

          current_stock:
            Number(
              item.current_stock ||
              0
            ),

          low_stock_limit:
            Number(
              item.low_stock_limit ||
              5
            ),

        })
      );


    return res.status(200).json({

      success: true,

      count:
        inventory.length,

      inventory,

    });

  } catch (error) {

    console.error(
      "GET INVENTORY ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        error.sqlMessage ||
        error.message ||
        "Failed to fetch inventory",

      error:
        error.sqlMessage ||
        error.message,

    });

  }
};


// =====================================================
// GET OUT OF STOCK
// GET /api/inventory/low-stock
// =====================================================

export const getLowStock = async (
  req,
  res
) => {

  try {

    const [rows] =
      await db.query(
        `
        SELECT
          i.id,
          i.product_id,

          p.product_type,
          p.product_name,
          p.selling_price,
          p.product_image,
          p.shop_location,

          COALESCE(
            i.current_stock,
            0
          ) AS current_stock,

          COALESCE(
            i.low_stock_limit,
            5
          ) AS low_stock_limit

        FROM inventory i

        INNER JOIN products p
          ON p.id = i.product_id

        WHERE
          p.is_active = 1
          AND i.current_stock = 0

        ORDER BY
          p.product_name ASC
        `
      );


    return res.status(200).json({

      success: true,

      count:
        rows.length,

      inventory:
        rows.map(
          (item) => ({

            ...item,

            current_stock:
              Number(
                item.current_stock ||
                0
              ),

            low_stock_limit:
              Number(
                item.low_stock_limit ||
                5
              ),

          })
        ),

    });

  } catch (error) {

    console.error(
      "GET OUT OF STOCK ERROR:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        error.sqlMessage ||
        error.message ||
        "Failed to fetch out of stock products",

    });

  }
};


// =====================================================
// GET INVENTORY BY PRODUCT
// GET /api/inventory/product/:productId
// =====================================================

export const getInventoryByProduct =
  async (
    req,
    res
  ) => {

    try {

      const productId =
        Number(
          req.params.productId
        );


      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid product ID",

        });

      }


      const [rows] =
        await db.query(
          `
          SELECT
            i.id,
            i.product_id,

            p.product_type,
            p.product_name,
            p.selling_price,
            p.product_image,
            p.shop_location,
            p.description,

            COALESCE(
              i.purchased_quantity,
              0
            ) AS purchased_quantity,

            COALESCE(
              i.sold_quantity,
              0
            ) AS sold_quantity,

            COALESCE(
              i.current_stock,
              0
            ) AS current_stock,

            COALESCE(
              i.low_stock_limit,
              5
            ) AS low_stock_limit,

            i.updated_at

          FROM inventory i

          INNER JOIN products p
            ON p.id = i.product_id

          WHERE
            i.product_id = ?

          LIMIT 1
          `,
          [productId]
        );


      if (
        rows.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            "Inventory record not found",

        });

      }


      const item =
        rows[0];


      return res.status(200).json({

        success: true,

        inventory: {

          ...item,

          id:
            Number(item.id),

          product_id:
            Number(
              item.product_id
            ),

          selling_price:
            Number(
              item.selling_price ||
              0
            ),

          purchased_quantity:
            Number(
              item.purchased_quantity ||
              0
            ),

          sold_quantity:
            Number(
              item.sold_quantity ||
              0
            ),

          current_stock:
            Number(
              item.current_stock ||
              0
            ),

          low_stock_limit:
            Number(
              item.low_stock_limit ||
              5
            ),

        },

      });

    } catch (error) {

      console.error(
        "GET PRODUCT INVENTORY ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error.sqlMessage ||
          error.message ||
          "Failed to fetch product inventory",

      });

    }
  };


// =====================================================
// ADD PURCHASE / ADD STOCK
// POST /api/inventory/purchase
// =====================================================

export const addPurchase =
  async (
    req,
    res
  ) => {

    const connection =
      await db.getConnection();


    try {

      const {
        product_id,
        quantity,
        purchase_price = 0,
      } = req.body;


      const productId =
        Number(product_id);


      const qty =
        Number(quantity);


      const purchasePrice =
        Number(
          purchase_price
        );


      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Valid product ID is required",

        });

      }


      if (
        !Number.isInteger(qty) ||
        qty <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Quantity must be greater than 0",

        });

      }


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


      await connection.beginTransaction();


      // ---------------------------------------------
      // CHECK PRODUCT
      // ---------------------------------------------

      const [
        products,
      ] =
        await connection.query(
          `
          SELECT
            id
          FROM products
          WHERE
            id = ?
            AND is_active = 1
          LIMIT 1
          `,
          [productId]
        );


      if (
        products.length === 0
      ) {

        await connection.rollback();


        return res.status(404).json({

          success: false,

          message:
            "Active product not found",

        });

      }


      // ---------------------------------------------
      // GET INVENTORY
      // ---------------------------------------------

      const [
        inventory,
      ] =
        await connection.query(
          `
          SELECT
            id,
            current_stock
          FROM inventory
          WHERE product_id = ?
          FOR UPDATE
          `,
          [productId]
        );


      if (
        inventory.length === 0
      ) {

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
          (?, ?, 0, ?, 5)
          `,
          [
            productId,
            qty,
            qty,
          ]
        );

      } else {

        await connection.query(
          `
          UPDATE inventory
          SET

            purchased_quantity =
              purchased_quantity + ?,

            current_stock =
              current_stock + ?

          WHERE product_id = ?
          `,
          [
            qty,
            qty,
            productId,
          ]
        );

      }


      await connection.commit();


      // ---------------------------------------------
      // GET UPDATED INVENTORY
      // ---------------------------------------------

      const [
        updated,
      ] =
        await db.query(
          `
          SELECT

            i.product_id,

            p.product_name,

            i.purchased_quantity,

            i.sold_quantity,

            i.current_stock,

            i.low_stock_limit

          FROM inventory i

          INNER JOIN products p
            ON p.id = i.product_id

          WHERE
            i.product_id = ?

          LIMIT 1
          `,
          [productId]
        );


      return res.status(200).json({

        success: true,

        message:
          "Stock added successfully",

        inventory: {

          ...updated[0],

          current_stock:
            Number(
              updated[0]
                ?.current_stock ||
              0
            ),

          purchased_quantity:
            Number(
              updated[0]
                ?.purchased_quantity ||
              0
            ),

          sold_quantity:
            Number(
              updated[0]
                ?.sold_quantity ||
              0
            ),

        },

      });

    } catch (error) {

      await connection.rollback();


      console.error(
        "ADD PURCHASE ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error.sqlMessage ||
          error.message ||
          "Failed to add stock",

      });

    } finally {

      connection.release();

    }
  };


// =====================================================
// ADJUST STOCK
// PATCH /api/inventory/:productId/adjust
// =====================================================

export const adjustStock =
  async (
    req,
    res
  ) => {

    const connection =
      await db.getConnection();


    try {

      const productId =
        Number(
          req.params.productId
        );


      const adjustment =
        Number(
          req.body.quantity
        );


      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid product ID",

        });

      }


      if (
        !Number.isInteger(
          adjustment
        ) ||
        adjustment === 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Adjustment cannot be zero",

        });

      }


      await connection.beginTransaction();


      const [
        rows,
      ] =
        await connection.query(
          `
          SELECT
            current_stock
          FROM inventory
          WHERE product_id = ?
          FOR UPDATE
          `,
          [productId]
        );


      if (
        rows.length === 0
      ) {

        await connection.rollback();


        return res.status(404).json({

          success: false,

          message:
            "Inventory record not found",

        });

      }


      const oldStock =
        Number(
          rows[0]
            .current_stock ||
          0
        );


      const newStock =
        oldStock +
        adjustment;


      if (
        newStock < 0
      ) {

        await connection.rollback();


        return res.status(400).json({

          success: false,

          message:
            "Stock cannot become negative",

        });

      }


      await connection.query(
        `
        UPDATE inventory

        SET
          current_stock = ?

        WHERE product_id = ?
        `,
        [
          newStock,
          productId,
        ]
      );


      await connection.commit();


      return res.status(200).json({

        success: true,

        message:
          "Stock adjusted successfully",

        previous_stock:
          oldStock,

        adjustment,

        current_stock:
          newStock,

      });

    } catch (error) {

      await connection.rollback();


      console.error(
        "ADJUST STOCK ERROR:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          error.sqlMessage ||
          error.message ||
          "Failed to adjust stock",

      });

    } finally {

      connection.release();

    }
  };