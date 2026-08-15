import db from "../config/db.js";

// =====================================================
// DASHBOARD SUMMARY
// GET /api/dashboard
// =====================================================

export const getDashboard = async (req, res) => {
  try {
    // =================================================
    // 1. AVAILABLE STOCK
    // =================================================

    const [stockResult] = await db.query(`
      SELECT
        COALESCE(
          SUM(current_stock),
          0
        ) AS available_stock
      FROM inventory
    `);

    // =================================================
    // 2. TOTAL PRODUCTS
    // =================================================

    const [productResult] = await db.query(`
      SELECT
        COUNT(*) AS total_products
      FROM products
      WHERE is_active = TRUE
    `);

    // =================================================
    // 3. PURCHASED ITEMS
    // =================================================

    const [purchaseResult] = await db.query(`
      SELECT
        COALESCE(
          SUM(quantity),
          0
        ) AS purchased_items
      FROM purchases
    `);

    // =================================================
    // 4. MONTHLY SALES
    // =================================================

    const [monthlySalesResult] =
      await db.query(`
        SELECT
          COUNT(*) AS total_sales,
          COALESCE(
            SUM(grand_total),
            0
          ) AS sales_amount
        FROM sales
        WHERE
          YEAR(sale_date) = YEAR(CURRENT_DATE())
          AND MONTH(sale_date) =
              MONTH(CURRENT_DATE())
      `);

    // =================================================
    // 5. YEARLY SALES
    // =================================================

    const [yearlySalesResult] =
      await db.query(`
        SELECT
          COUNT(*) AS total_sales,
          COALESCE(
            SUM(grand_total),
            0
          ) AS sales_amount
        FROM sales
        WHERE
          YEAR(sale_date) =
          YEAR(CURRENT_DATE())
      `);

    // =================================================
    // 6. LOW STOCK
    // =================================================

    const [lowStockResult] =
      await db.query(`
        SELECT
          p.id,
          p.product_name,
          p.product_type,
          p.shop_location,

          i.current_stock,
          i.low_stock_limit

        FROM inventory i

        INNER JOIN products p
          ON i.product_id = p.id

        WHERE
          p.is_active = TRUE
          AND i.current_stock <=
              i.low_stock_limit

        ORDER BY
          i.current_stock ASC
      `);

    // =================================================
    // 7. TOTAL CUSTOMERS
    // =================================================

    const [customerResult] =
      await db.query(`
        SELECT
          COUNT(*) AS total_customers
        FROM customers
      `);

    // =================================================
    // 8. RECENT SALES
    // =================================================

    const [recentSales] =
      await db.query(`
        SELECT
          s.id,

          c.name AS customer_name,
          c.mobile AS customer_mobile,

          s.subtotal,
          s.discount_amount,
          s.gst_amount,
          s.grand_total,

          s.payment_status,
          s.payment_method,

          s.sale_date

        FROM sales s

        INNER JOIN customers c
          ON s.customer_id = c.id

        ORDER BY
          s.sale_date DESC

        LIMIT 10
      `);

    // =================================================
    // 9. SHOP-WISE STOCK
    // =================================================

    const [shopStock] =
      await db.query(`
        SELECT
          p.shop_location,

          COUNT(
            DISTINCT p.id
          ) AS total_products,

          COALESCE(
            SUM(i.current_stock),
            0
          ) AS current_stock

        FROM products p

        LEFT JOIN inventory i
          ON p.id = i.product_id

        WHERE
          p.is_active = TRUE

        GROUP BY
          p.shop_location

        ORDER BY
          p.shop_location
      `);

    // =================================================
    // 10. PRODUCT TYPE STOCK
    // =================================================

    const [typeStock] =
      await db.query(`
        SELECT
          p.product_type,

          COUNT(
            DISTINCT p.id
          ) AS total_products,

          COALESCE(
            SUM(i.current_stock),
            0
          ) AS current_stock

        FROM products p

        LEFT JOIN inventory i
          ON p.id = i.product_id

        WHERE
          p.is_active = TRUE

        GROUP BY
          p.product_type
      `);

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,

      dashboard: {
        available_stock:
          Number(
            stockResult[0]
              .available_stock
          ),

        total_products:
          Number(
            productResult[0]
              .total_products
          ),

        purchased_items:
          Number(
            purchaseResult[0]
              .purchased_items
          ),

        monthly_sales: {
          total_sales:
            Number(
              monthlySalesResult[0]
                .total_sales
            ),

          sales_amount:
            Number(
              monthlySalesResult[0]
                .sales_amount
            ),
        },

        yearly_sales: {
          total_sales:
            Number(
              yearlySalesResult[0]
                .total_sales
            ),

          sales_amount:
            Number(
              yearlySalesResult[0]
                .sales_amount
            ),
        },

        total_customers:
          Number(
            customerResult[0]
              .total_customers
          ),

        low_stock: {
          count: lowStockResult.length,
          products: lowStockResult,
        },

        shop_stock: shopStock,

        product_type_stock:
          typeStock,

        recent_sales:
          recentSales,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load dashboard",
    });
  }
};


// =====================================================
// MONTHLY SALES CHART
// GET /api/dashboard/monthly-sales
// =====================================================

export const getMonthlySales = async (
  req,
  res
) => {
  try {
    const [sales] =
      await db.query(`
        SELECT
          MONTH(sale_date) AS month_number,

          MONTHNAME(sale_date) AS month_name,

          COUNT(*) AS total_orders,

          COALESCE(
            SUM(grand_total),
            0
          ) AS total_sales

        FROM sales

        WHERE
          YEAR(sale_date) =
          YEAR(CURRENT_DATE())

        GROUP BY
          MONTH(sale_date),
          MONTHNAME(sale_date)

        ORDER BY
          MONTH(sale_date)
      `);

    return res.status(200).json({
      success: true,
      sales,
    });
  } catch (error) {
    console.error(
      "Monthly Sales Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch monthly sales",
    });
  }
};


// =====================================================
// YEARLY SALES
// GET /api/dashboard/yearly-sales
// =====================================================

export const getYearlySales = async (
  req,
  res
) => {
  try {
    const [sales] =
      await db.query(`
        SELECT
          YEAR(sale_date) AS year,

          COUNT(*) AS total_orders,

          COALESCE(
            SUM(grand_total),
            0
          ) AS total_sales

        FROM sales

        GROUP BY
          YEAR(sale_date)

        ORDER BY
          YEAR(sale_date) DESC
      `);

    return res.status(200).json({
      success: true,
      sales,
    });
  } catch (error) {
    console.error(
      "Yearly Sales Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch yearly sales",
    });
  }
};


// =====================================================
// LOW STOCK PRODUCTS
// GET /api/dashboard/low-stock
// =====================================================

export const getLowStock = async (
  req,
  res
) => {
  try {
    const [products] =
      await db.query(`
        SELECT
          p.id,
          p.product_name,
          p.product_type,
          p.shop_location,

          i.current_stock,
          i.low_stock_limit

        FROM inventory i

        INNER JOIN products p
          ON i.product_id = p.id

        WHERE
          p.is_active = TRUE

          AND i.current_stock <=
              i.low_stock_limit

        ORDER BY
          i.current_stock ASC,
          p.product_name ASC
      `);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(
      "Low Stock Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch low stock products",
    });
  }
};