import db from "../config/db.js";
import fs from "fs";
import path from "path";

// =====================================================
// HELPERS
// =====================================================

const parseImages = (
  value
) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (
    typeof value === "string"
  ) {
    const trimmed =
      value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(trimmed);

      if (
        Array.isArray(parsed)
      ) {
        return parsed.filter(
          Boolean
        );
      }

      if (
        typeof parsed ===
        "string"
      ) {
        return parsed
          ? [parsed]
          : [];
      }
    } catch {
      // normal string
    }

    return [trimmed];
  }

  return [];
};

// =====================================================
// NORMALIZE PRODUCT
// =====================================================

const normalizeProduct = (
  product
) => {
  if (!product) {
    return null;
  }

  const images =
    parseImages(
      product.product_image
    );

  const stock =
    Number(
      product.stock_quantity ??
        0
    );

  const minimumStock =
    Number(
      product.minimum_stock ??
        5
    );

  const price =
    Number(
      product.selling_price ??
        0
    );

  let status = "Active";

  if (
    Number(
      product.is_active
    ) !== 1
  ) {
    status = "Inactive";
  } else if (
    stock <= 0
  ) {
    status = "Out of Stock";
  } else if (
    stock <= minimumStock
  ) {
    status = "Low Stock";
  }

  return {
    ...product,

    id: Number(
      product.id
    ),

    ProductID: Number(
      product.id
    ),

    ProductName:
      product.product_name ||
      "",

    ProductType:
      product.product_type ||
      "",

    Price: price,

    SellingPrice: price,

    StockQuantity: stock,

    Stock: stock,

    Quantity: stock,

    MinimumStock:
      minimumStock,

    ImageURL:
      images[0] || null,

    Images: images,

    images: images,

    image_count:
      images.length,

    IsActive:
      Number(
        product.is_active
      ) === 1,

    stock_status:
      status,

    StockStatus:
      status,
  };
};

// =====================================================
// DELETE LOCAL IMAGE FILE
// =====================================================

const deleteImageFile = (
  image
) => {
  try {
    if (
      typeof image !==
        "string" ||
      !image
    ) {
      return;
    }

    if (
      image.startsWith(
        "http://"
      ) ||
      image.startsWith(
        "https://"
      ) ||
      image.startsWith(
        "data:"
      )
    ) {
      return;
    }

    let relativePath =
      image;

    if (
      relativePath.startsWith(
        "/"
      )
    ) {
      relativePath =
        relativePath.substring(
          1
        );
    }

    const filePath =
      path.join(
        process.cwd(),
        relativePath
      );

    if (
      fs.existsSync(
        filePath
      )
    ) {
      fs.unlinkSync(
        filePath
      );
    }
  } catch (error) {
    console.error(
      "IMAGE DELETE ERROR:",
      error.message
    );
  }
};

// =====================================================
// DELETE MULTIPLE IMAGE FILES
// =====================================================

const deleteImages = (
  images
) => {
  const list =
    parseImages(images);

  for (
    const image of list
  ) {
    deleteImageFile(
      image
    );
  }
};

// =====================================================
// GET ALL PRODUCTS
// GET /api/products
// =====================================================

export const getProducts =
  async (
    req,
    res
  ) => {
    try {
      const [rows] =
        await db.query(`
          SELECT
            id,
            product_type,
            product_name,
            selling_price,
            product_image,
            stock_quantity,
            minimum_stock,
            shop_location,
            description,
            is_active,
            created_at,
            updated_at
          FROM products
          ORDER BY id DESC
        `);

      const products =
        rows.map(
          normalizeProduct
        );

      const totalProducts =
        products.length;

      const activeProducts =
        products.filter(
          (product) =>
            product.IsActive
        ).length;

      const lowStock =
        products.filter(
          (product) =>
            product.IsActive &&
            product.StockQuantity >
              0 &&
            product.StockQuantity <=
              product.MinimumStock
        ).length;

      const outOfStock =
        products.filter(
          (product) =>
            product.IsActive &&
            product.StockQuantity <=
              0
        ).length;

      return res.status(
        200
      ).json({
        success: true,

        products,

        data: products,

        count:
          totalProducts,

        stats: {
          totalProducts,
          activeProducts,
          lowStock,
          outOfStock,
        },
      });
    } catch (error) {
      console.error(
        "GET PRODUCTS ERROR:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        message:
          "Failed to fetch products",
        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// =====================================================
// GET PRODUCT BY ID
// GET /api/products/:id
// =====================================================

export const getProductById =
  async (
    req,
    res
  ) => {
    try {
      const productId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid product ID",
          });
      }

      const [rows] =
        await db.query(
          `
          SELECT
            id,
            product_type,
            product_name,
            selling_price,
            product_image,
            stock_quantity,
            minimum_stock,
            shop_location,
            description,
            is_active,
            created_at,
            updated_at
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [productId]
        );

      if (
        rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Product not found",
          });
      }

      const product =
        normalizeProduct(
          rows[0]
        );

      return res.status(
        200
      ).json({
        success: true,
        product,
        data: product,
      });
    } catch (error) {
      console.error(
        "GET PRODUCT ERROR:",
        error
      );

      return res.status(
        500
      ).json({
        success: false,
        message:
          "Failed to fetch product",
        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  };

// =====================================================
// CREATE PRODUCT
// POST /api/products
// =====================================================

export const createProduct =
  async (
    req,
    res
  ) => {
    try {
      const {
        product_type,
        product_name,
        selling_price,
        stock_quantity,
        minimum_stock,
        shop_location,
        description,
        is_active,
      } = req.body;

      // =================================================
      // REQUIRED
      // =================================================

      if (
        !product_type ||
        !product_name ||
        selling_price ===
          undefined ||
        selling_price ===
          ""
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Product type, product name and selling price are required.",
          });
      }

      // =================================================
      // PRODUCT TYPE
      // =================================================

      const allowedTypes =
        [
          "Frame",
          "Sunglass",
        ];

      if (
        !allowedTypes.includes(
          product_type
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Product type must be Frame or Sunglass.",
          });
      }

      // =================================================
      // LOCATION
      // =================================================

      const allowedLocations =
        [
          "Arjunganj",
          "Telibag",
        ];

      if (
        !allowedLocations.includes(
          shop_location
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Location must be Arjunganj or Telibag.",
          });
      }

      // =================================================
      // VALUES
      // =================================================

      const price =
        Number(
          selling_price
        );

      const stock =
        Number(
          stock_quantity ??
            0
        );

      const minimum =
        Number(
          minimum_stock ??
            5
        );

      // =================================================
      // VALIDATION
      // =================================================

      if (
        !Number.isFinite(
          price
        ) ||
        price < 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid selling price.",
          });
      }

      if (
        !Number.isInteger(
          stock
        ) ||
        stock < 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid stock quantity.",
          });
      }

      if (
        !Number.isInteger(
          minimum
        ) ||
        minimum < 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid minimum stock.",
          });
      }

      // =================================================
      // IMAGES
      // =================================================

      let productImages =
        [];

      if (
        req.files &&
        req.files.length >
          0
      ) {
        productImages =
          req.files.map(
            (file) =>
              `/uploads/products/${file.filename}`
          );
      }

      const imageValue =
        JSON.stringify(
          productImages
        );

      // =================================================
      // INSERT
      // =================================================

      const [result] =
        await db.query(
          `
          INSERT INTO products
          (
            product_type,
            product_name,
            selling_price,
            product_image,
            stock_quantity,
            minimum_stock,
            shop_location,
            description,
            is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            product_type,

            product_name.trim(),

            price,

            imageValue,

            stock,

            minimum,

            shop_location,

            description?.trim() ||
              null,

            is_active ===
              undefined
              ? 1
              : Number(
                  is_active
                ),
          ]
        );

      // =================================================
      // FETCH CREATED PRODUCT
      // =================================================

      const [rows] =
        await db.query(
          `
          SELECT
            id,
            product_type,
            product_name,
            selling_price,
            product_image,
            stock_quantity,
            minimum_stock,
            shop_location,
            description,
            is_active,
            created_at,
            updated_at
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [
            result.insertId,
          ]
        );

      const product =
        normalizeProduct(
          rows[0]
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Product created successfully.",
          product,
          data: product,
        });
    } catch (error) {
      console.error(
        "CREATE PRODUCT ERROR:",
        error
      );

      // Remove uploaded files
      if (
        req.files?.length
      ) {
        req.files.forEach(
          (file) => {
            try {
              if (
                fs.existsSync(
                  file.path
                )
              ) {
                fs.unlinkSync(
                  file.path
                );
              }
            } catch (
              cleanupError
            ) {
              console.error(
                "IMAGE CLEANUP ERROR:",
                cleanupError.message
              );
            }
          }
        );
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to create product.",
          error:
            process.env.NODE_ENV ===
            "development"
              ? error.message
              : undefined,
        });
    }
  };

// =====================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// =====================================================

export const updateProduct =
  async (
    req,
    res
  ) => {
    try {
      const productId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid product ID.",
          });
      }

      // =================================================
      // GET EXISTING
      // =================================================

      const [existingRows] =
        await db.query(
          `
          SELECT
            id,
            product_image
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [productId]
        );

      if (
        existingRows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Product not found.",
          });
      }

      const existing =
        existingRows[0];

      // =================================================
      // REQUEST DATA
      // =================================================

      const {
        product_type,
        product_name,
        selling_price,
        stock_quantity,
        minimum_stock,
        shop_location,
        description,
        is_active,
        existing_images,
      } = req.body;

      // =================================================
      // VALIDATE TYPE
      // =================================================

      if (
        product_type
      ) {
        const allowedTypes =
          [
            "Frame",
            "Sunglass",
          ];

        if (
          !allowedTypes.includes(
            product_type
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Product type must be Frame or Sunglass.",
            });
        }
      }

      // =================================================
      // VALIDATE LOCATION
      // =================================================

      if (
        shop_location
      ) {
        const allowedLocations =
          [
            "Arjunganj",
            "Telibag",
          ];

        if (
          !allowedLocations.includes(
            shop_location
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Location must be Arjunganj or Telibag.",
            });
        }
      }

      // =================================================
      // NUMBERS
      // =================================================

      const price =
        selling_price !==
          undefined &&
        selling_price !==
          ""
          ? Number(
              selling_price
            )
          : undefined;

      const stock =
        stock_quantity !==
          undefined &&
        stock_quantity !==
          ""
          ? Number(
              stock_quantity
            )
          : undefined;

      const minimum =
        minimum_stock !==
          undefined &&
        minimum_stock !==
          ""
          ? Number(
              minimum_stock
            )
          : undefined;

      if (
        price !==
          undefined &&
        (!Number.isFinite(
          price
        ) ||
          price < 0)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid selling price.",
          });
      }

      if (
        stock !==
          undefined &&
        (!Number.isInteger(
          stock
        ) ||
          stock < 0)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid stock quantity.",
          });
      }

      if (
        minimum !==
          undefined &&
        (!Number.isInteger(
          minimum
        ) ||
          minimum < 0)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid minimum stock.",
          });
      }

      // =================================================
      // EXISTING IMAGES
      // =================================================

      let keptImages =
        parseImages(
          existing_images
        );

      // =================================================
      // NEW UPLOADED IMAGES
      // =================================================

      let newImages =
        [];

      if (
        req.files &&
        req.files.length >
          0
      ) {
        newImages =
          req.files.map(
            (file) =>
              `/uploads/products/${file.filename}`
          );
      }

      // =================================================
      // COMBINE
      // =================================================

      let finalImages = [
        ...keptImages,
        ...newImages,
      ];

      finalImages = [
        ...new Set(
          finalImages.filter(
            Boolean
          )
        ),
      ].slice(
        0,
        5
      );

      // =================================================
      // DELETE REMOVED OLD IMAGES
      // =================================================

      const oldImages =
        parseImages(
          existing.product_image
        );

      const removedImages =
        oldImages.filter(
          (image) =>
            !finalImages.includes(
              image
            )
        );

      deleteImages(
        removedImages
      );

      // =================================================
      // IMAGE VALUE
      // =================================================

      const imageValue =
        JSON.stringify(
          finalImages
        );

      // =================================================
      // UPDATE
      // =================================================

      await db.query(
        `
        UPDATE products
        SET
          product_type =
            COALESCE(
              ?,
              product_type
            ),

          product_name =
            COALESCE(
              ?,
              product_name
            ),

          selling_price =
            COALESCE(
              ?,
              selling_price
            ),

          product_image = ?,

          stock_quantity =
            COALESCE(
              ?,
              stock_quantity
            ),

          minimum_stock =
            COALESCE(
              ?,
              minimum_stock
            ),

          shop_location =
            COALESCE(
              ?,
              shop_location
            ),

          description =
            COALESCE(
              ?,
              description
            ),

          is_active =
            COALESCE(
              ?,
              is_active
            )

        WHERE id = ?
        `,
        [
          product_type ||
            null,

          product_name?.trim() ||
            null,

          price ??
            null,

          imageValue,

          stock ??
            null,

          minimum ??
            null,

          shop_location ||
            null,

          description !==
            undefined
            ? description.trim()
            : null,

          is_active !==
            undefined
            ? Number(
                is_active
              )
            : null,

          productId,
        ]
      );

      // =================================================
      // FETCH UPDATED
      // =================================================

      const [rows] =
        await db.query(
          `
          SELECT
            id,
            product_type,
            product_name,
            selling_price,
            product_image,
            stock_quantity,
            minimum_stock,
            shop_location,
            description,
            is_active,
            created_at,
            updated_at
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [productId]
        );

      const product =
        normalizeProduct(
          rows[0]
        );

      return res.status(
        200
      ).json({
        success: true,
        message:
          "Product updated successfully.",
        product,
        data: product,
      });
    } catch (error) {
      console.error(
        "UPDATE PRODUCT ERROR:",
        error
      );

      // Remove newly uploaded files
      if (
        req.files?.length
      ) {
        req.files.forEach(
          (file) => {
            try {
              if (
                fs.existsSync(
                  file.path
                )
              ) {
                fs.unlinkSync(
                  file.path
                );
              }
            } catch (
              cleanupError
            ) {
              console.error(
                "UPDATE IMAGE CLEANUP ERROR:",
                cleanupError.message
              );
            }
          }
        );
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to update product.",
          error:
            process.env.NODE_ENV ===
            "development"
              ? error.message
              : undefined,
        });
    }
  };

// =====================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// =====================================================

export const deleteProduct =
  async (
    req,
    res
  ) => {
    try {
      const productId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid product ID.",
          });
      }

      const [rows] =
        await db.query(
          `
          SELECT
            id
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [productId]
        );

      if (
        rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Product not found.",
          });
      }

      // Soft delete
      await db.query(
        `
        UPDATE products
        SET is_active = 0
        WHERE id = ?
        `,
        [productId]
      );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Product deleted successfully.",
        });
    } catch (error) {
      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to delete product.",
          error:
            process.env.NODE_ENV ===
            "development"
              ? error.message
              : undefined,
        });
    }
  };

// =====================================================
// RESTORE PRODUCT
// PATCH /api/products/:id/restore
// =====================================================

export const restoreProduct =
  async (
    req,
    res
  ) => {
    try {
      const productId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid product ID.",
          });
      }

      const [result] =
        await db.query(
          `
          UPDATE products
          SET is_active = 1
          WHERE id = ?
          `,
          [productId]
        );

      if (
        result.affectedRows ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Product not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Product restored successfully.",
        });
    } catch (error) {
      console.error(
        "RESTORE PRODUCT ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Failed to restore product.",
          error:
            process.env.NODE_ENV ===
            "development"
              ? error.message
              : undefined,
        });
    }
  };