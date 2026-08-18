import db from "../config/db.js";
import cloudinary from "../config/cloudinary.js";

// =====================================================
// HELPERS
// =====================================================

// =====================================================
// PARSE IMAGES
// =====================================================

const parseImages = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }

      if (typeof parsed === "string") {
        return parsed ? [parsed] : [];
      }
    } catch {
      // Normal string
    }

    return [trimmed];
  }

  return [];
};


// =====================================================
// NORMALIZE PRODUCT
// =====================================================

const normalizeProduct = (product) => {
  if (!product) {
    return null;
  }

  const images = parseImages(
    product.product_image
  );

  const stock = Number(
    product.stock_quantity ?? 0
  );

  const minimumStock = Number(
    product.minimum_stock ?? 5
  );

  const price = Number(
    product.selling_price ?? 0
  );

  let status = "Active";

  if (
    Number(product.is_active) !== 1
  ) {
    status = "Inactive";
  } else if (stock <= 0) {
    status = "Out of Stock";
  } else if (
    stock <= minimumStock
  ) {
    status = "Low Stock";
  }

  return {
    ...product,

    id: Number(product.id),

    ProductID: Number(product.id),

    ProductName:
      product.product_name || "",

    ProductType:
      product.product_type || "",

    Price: price,

    SellingPrice: price,

    StockQuantity: stock,

    Stock: stock,

    Quantity: stock,

    MinimumStock:
      minimumStock,

    ImageURL:
      images[0] || null,

    Images:
      images,

    images:
      images,

    image_count:
      images.length,

    IsActive:
      Number(product.is_active) === 1,

    stock_status:
      status,

    StockStatus:
      status,
  };
};


// =====================================================
// CLOUDINARY UPLOAD
// =====================================================
//
// Multer memoryStorage() se file.buffer milta hai.
// Ye buffer directly Cloudinary par upload hota hai.
//
// =====================================================

const uploadToCloudinary = (
  file
) => {
  return new Promise(
    (resolve, reject) => {

      if (!file?.buffer) {
        return reject(
          new Error(
            "Image buffer is missing."
          )
        );
      }

      cloudinary.uploader.upload_stream(
        {
          folder:
            "chashma-plus/products",

          resource_type:
            "image",

          use_filename: true,

          unique_filename: true,

          overwrite: false,
        },

        (
          error,
          result
        ) => {

          if (error) {
            return reject(
              error
            );
          }

          resolve(
            result
          );
        }
      ).end(
        file.buffer
      );
    }
  );
};


// =====================================================
// GET CLOUDINARY PUBLIC ID
// =====================================================
//
// Example:
// https://res.cloudinary.com/demo/image/upload/v123/
// chashma-plus/products/abc.jpg
//
// Returns:
// chashma-plus/products/abc
//
// =====================================================

const getCloudinaryPublicId = (
  imageUrl
) => {

  if (
    !imageUrl ||
    typeof imageUrl !== "string"
  ) {
    return null;
  }

  if (
    !imageUrl.includes(
      "res.cloudinary.com"
    )
  ) {
    return null;
  }

  try {

    const uploadPart =
      "/image/upload/";

    const index =
      imageUrl.indexOf(
        uploadPart
      );

    if (index === -1) {
      return null;
    }

    let publicPath =
      imageUrl.substring(
        index +
          uploadPart.length
      );

    // Remove transformations/version
    const parts =
      publicPath.split("/");

    if (
      parts[0]?.startsWith("v") &&
      /^v\d+$/.test(
        parts[0]
      )
    ) {
      parts.shift();
    }

    publicPath =
      parts.join("/");

    // Remove extension
    publicPath =
      publicPath.replace(
        /\.(jpg|jpeg|png|webp|gif|avif)$/i,
        ""
      );

    return publicPath;
  } catch {
    return null;
  }
};


// =====================================================
// DELETE CLOUDINARY IMAGES
// =====================================================

const deleteCloudinaryImages =
  async (images) => {

    const imageList =
      parseImages(images);

    for (
      const imageUrl of imageList
    ) {

      try {

        const publicId =
          getCloudinaryPublicId(
            imageUrl
          );

        if (!publicId) {
          continue;
        }

        await cloudinary.uploader.destroy(
          publicId,
          {
            resource_type:
              "image",
          }
        );

      } catch (error) {

        console.error(
          "CLOUDINARY DELETE ERROR:",
          error.message
        );

      }
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
          ORDER BY id DESC
          `
        );

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
            product.StockQuantity > 0 &&
            product.StockQuantity <=
              product.MinimumStock
        ).length;

      const outOfStock =
        products.filter(
          (product) =>
            product.IsActive &&
            product.StockQuantity <= 0
        ).length;

      return res.status(
        200
      ).json({

        success: true,

        products,

        data:
          products,

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

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid product ID.",

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
          [
            productId,
          ]
        );

      if (
        rows.length === 0
      ) {

        return res.status(
          404
        ).json({

          success: false,

          message:
            "Product not found.",

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

        data:
          product,

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
//
// Product create ke saath:
// 1. Images Cloudinary par upload
// 2. URLs MySQL mein save
// 3. Inventory record create
//
// =====================================================

export const createProduct =
  async (
    req,
    res
  ) => {

    let connection = null;

    const uploadedImages = [];

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
      // REQUIRED FIELDS
      // =================================================

      if (
        !product_type ||
        !product_name ||
        selling_price ===
          undefined ||
        selling_price === ""
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Product type, product name and selling price are required.",

        });
      }


      // =================================================
      // PRODUCT TYPE
      // =================================================

      const allowedTypes = [
        "Frame",
        "Sunglass",
      ];

      if (
        !allowedTypes.includes(
          product_type
        )
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Product type must be Frame or Sunglass.",

        });
      }


      // =================================================
      // LOCATION
      // =================================================

      const allowedLocations = [
        "Arjunganj",
        "Telibag",
      ];

      if (
        !allowedLocations.includes(
          shop_location
        )
      ) {

        return res.status(
          400
        ).json({

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
          stock_quantity ?? 0
        );

      const minimum =
        Number(
          minimum_stock ?? 5
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

        return res.status(
          400
        ).json({

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

        return res.status(
          400
        ).json({

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

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid minimum stock.",

        });
      }


      // =================================================
      // CLOUDINARY IMAGES
      // =================================================

      let productImages = [];

      if (
        req.files &&
        req.files.length > 0
      ) {

        for (
          const file of req.files
        ) {

          const result =
            await uploadToCloudinary(
              file
            );

          if (
            result?.secure_url
          ) {

            productImages.push(
              result.secure_url
            );

            uploadedImages.push(
              result.secure_url
            );
          }
        }
      }


      // Maximum 5 images

      productImages =
        productImages
          .filter(Boolean)
          .slice(0, 5);


      const imageValue =
        JSON.stringify(
          productImages
        );


      // =================================================
      // DATABASE CONNECTION
      // =================================================

      connection =
        await db.getConnection();

      await connection.beginTransaction();


      // =================================================
      // INSERT PRODUCT
      // =================================================

      const [result] =
        await connection.query(
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


      const productId =
        result.insertId;


      // =================================================
      // CREATE INVENTORY
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
        VALUES (?, ?, 0, ?, ?)
        `,
        [

          productId,

          stock,

          stock,

          minimum,

        ]
      );


      // =================================================
      // COMMIT
      // =================================================

      await connection.commit();


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
            productId,
          ]
        );


      const product =
        normalizeProduct(
          rows[0]
        );


      return res.status(
        201
      ).json({

        success: true,

        message:
          "Product created successfully.",

        product,

        data:
          product,

      });

    } catch (error) {

      if (connection) {

        try {

          await connection.rollback();

        } catch (
          rollbackError
        ) {

          console.error(
            "CREATE PRODUCT ROLLBACK ERROR:",
            rollbackError.message
          );
        }
      }


      console.error(
        "CREATE PRODUCT ERROR:",
        error
      );


      // =================================================
      // DELETE CLOUDINARY IMAGES IF DB FAILED
      // =================================================

      if (
        uploadedImages.length
      ) {

        await deleteCloudinaryImages(
          uploadedImages
        );
      }


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Failed to create product.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,

      });

    } finally {

      if (connection) {

        connection.release();

      }
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

    let connection = null;

    const uploadedImages = [];

    try {

      const productId =
        Number(
          req.params.id
        );


      // =================================================
      // VALIDATE ID
      // =================================================

      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid product ID.",

        });
      }


      // =================================================
      // GET EXISTING PRODUCT
      // =================================================

      const [
        existingRows,
      ] =
        await db.query(
          `
          SELECT
            id,
            product_image,
            stock_quantity,
            minimum_stock
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [
            productId,
          ]
        );


      if (
        existingRows.length === 0
      ) {

        return res.status(
          404
        ).json({

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
      // VALIDATE PRODUCT TYPE
      // =================================================

      if (product_type) {

        const allowedTypes = [
          "Frame",
          "Sunglass",
        ];

        if (
          !allowedTypes.includes(
            product_type
          )
        ) {

          return res.status(
            400
          ).json({

            success: false,

            message:
              "Product type must be Frame or Sunglass.",

          });
        }
      }


      // =================================================
      // VALIDATE LOCATION
      // =================================================

      if (shop_location) {

        const allowedLocations = [
          "Arjunganj",
          "Telibag",
        ];

        if (
          !allowedLocations.includes(
            shop_location
          )
        ) {

          return res.status(
            400
          ).json({

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
        selling_price !== ""
          ? Number(
              selling_price
            )
          : undefined;


      const stock =
        stock_quantity !==
          undefined &&
        stock_quantity !== ""
          ? Number(
              stock_quantity
            )
          : undefined;


      const minimum =
        minimum_stock !==
          undefined &&
        minimum_stock !== ""
          ? Number(
              minimum_stock
            )
          : undefined;


      // =================================================
      // VALIDATE PRICE
      // =================================================

      if (
        price !== undefined &&
        (
          !Number.isFinite(
            price
          ) ||
          price < 0
        )
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid selling price.",

        });
      }


      // =================================================
      // VALIDATE STOCK
      // =================================================

      if (
        stock !== undefined &&
        (
          !Number.isInteger(
            stock
          ) ||
          stock < 0
        )
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid stock quantity.",

        });
      }


      // =================================================
      // VALIDATE MINIMUM STOCK
      // =================================================

      if (
        minimum !== undefined &&
        (
          !Number.isInteger(
            minimum
          ) ||
          minimum < 0
        )
      ) {

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid minimum stock.",

        });
      }


      // =================================================
      // EXISTING IMAGES
      // =================================================
      //
      // If frontend sends existing_images,
      // those images will be preserved.
      //
      // If frontend doesn't send existing_images,
      // old images are preserved automatically.
      //
      // =================================================

      let keptImages = [];

      if (
        existing_images !==
        undefined
      ) {

        keptImages =
          parseImages(
            existing_images
          );

      } else {

        keptImages =
          parseImages(
            existing.product_image
          );
      }


      // =================================================
      // UPLOAD NEW IMAGES
      // =================================================

      let newImages = [];

      if (
        req.files &&
        req.files.length > 0
      ) {

        for (
          const file of req.files
        ) {

          const result =
            await uploadToCloudinary(
              file
            );

          if (
            result?.secure_url
          ) {

            newImages.push(
              result.secure_url
            );

            uploadedImages.push(
              result.secure_url
            );
          }
        }
      }


      // =================================================
      // COMBINE IMAGES
      // =================================================

      let finalImages = [
        ...keptImages,
        ...newImages,
      ];


      finalImages =
        [
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
      // OLD IMAGES
      // =================================================

      const oldImages =
        parseImages(
          existing.product_image
        );


      // =================================================
      // REMOVED IMAGES
      // =================================================

      const removedImages =
        oldImages.filter(
          (image) =>
            !finalImages.includes(
              image
            )
        );


      const imageValue =
        JSON.stringify(
          finalImages
        );


      // =================================================
      // DATABASE CONNECTION
      // =================================================

      connection =
        await db.getConnection();

      await connection.beginTransaction();


      // =================================================
      // UPDATE PRODUCT
      // =================================================

      await connection.query(
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
      // SYNC INVENTORY
      // =================================================

      const [
        inventoryRows,
      ] =
        await connection.query(
          `
          SELECT
            id
          FROM inventory
          WHERE product_id = ?
          LIMIT 1
          `,
          [
            productId,
          ]
        );


      const finalStock =
        stock !== undefined
          ? stock
          : Number(
              existing.stock_quantity ??
                0
            );


      const finalMinimum =
        minimum !== undefined
          ? minimum
          : Number(
              existing.minimum_stock ??
                5
            );


      if (
        inventoryRows.length > 0
      ) {

        await connection.query(
          `
          UPDATE inventory
          SET
            current_stock = ?,
            low_stock_limit = ?
          WHERE product_id = ?
          `,
          [

            finalStock,

            finalMinimum,

            productId,

          ]
        );

      } else {

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
          VALUES (?, ?, 0, ?, ?)
          `,
          [

            productId,

            finalStock,

            finalStock,

            finalMinimum,

          ]
        );
      }


      // =================================================
      // COMMIT
      // =================================================

      await connection.commit();


      // =================================================
      // DELETE REMOVED CLOUDINARY IMAGES
      // =================================================

      if (
        removedImages.length
      ) {

        await deleteCloudinaryImages(
          removedImages
        );
      }


      // =================================================
      // FETCH UPDATED PRODUCT
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
            productId,
          ]
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

        data:
          product,

      });

    } catch (error) {

      if (connection) {

        try {

          await connection.rollback();

        } catch (
          rollbackError
        ) {

          console.error(
            "UPDATE PRODUCT ROLLBACK ERROR:",
            rollbackError.message
          );
        }
      }


      console.error(
        "UPDATE PRODUCT ERROR:",
        error
      );


      // =================================================
      // DELETE NEW CLOUDINARY IMAGES
      // IF UPDATE FAILS
      // =================================================

      if (
        uploadedImages.length
      ) {

        await deleteCloudinaryImages(
          uploadedImages
        );
      }


      return res.status(
        500
      ).json({

        success: false,

        message:
          "Failed to update product.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,

      });

    } finally {

      if (connection) {

        connection.release();

      }
    }
  };


// =====================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// =====================================================
//
// Soft delete only.
// Images are NOT deleted from Cloudinary.
//
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

        return res.status(
          400
        ).json({

          success: false,

          message:
            "Invalid product ID.",

        });
      }


      const [
        rows,
      ] =
        await db.query(
          `
          SELECT
            id
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [
            productId,
          ]
        );


      if (
        rows.length === 0
      ) {

        return res.status(
          404
        ).json({

          success: false,

          message:
            "Product not found.",

        });
      }


      await db.query(
        `
        UPDATE products
        SET is_active = 0
        WHERE id = ?
        `,
        [
          productId,
        ]
      );


      return res.status(
        200
      ).json({

        success: true,

        message:
          "Product deleted successfully.",

      });

    } catch (error) {

      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      return res.status(
        500
      ).json({

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

        return res.status(
          400
        ).json({

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
          [
            productId,
          ]
        );


      if (
        result.affectedRows === 0
      ) {

        return res.status(
          404
        ).json({

          success: false,

          message:
            "Product not found.",

        });
      }


      // =================================================
      // GET PRODUCT STOCK
      // =================================================

      const [
        products,
      ] =
        await db.query(
          `
          SELECT
            stock_quantity,
            minimum_stock
          FROM products
          WHERE id = ?
          LIMIT 1
          `,
          [
            productId,
          ]
        );


      if (
        products.length > 0
      ) {

        const [
          inventory,
        ] =
          await db.query(
            `
            SELECT
              id
            FROM inventory
            WHERE product_id = ?
            LIMIT 1
            `,
            [
              productId,
            ]
          );


        if (
          inventory.length === 0
        ) {

          const stock =
            Number(
              products[0]
                .stock_quantity ||
                0
            );

          const minimum =
            Number(
              products[0]
                .minimum_stock ||
                5
            );


          await db.query(
            `
            INSERT INTO inventory
            (
              product_id,
              purchased_quantity,
              sold_quantity,
              current_stock,
              low_stock_limit
            )
            VALUES (?, ?, 0, ?, ?)
            `,
            [

              productId,

              stock,

              stock,

              minimum,

            ]
          );
        }
      }


      return res.status(
        200
      ).json({

        success: true,

        message:
          "Product restored successfully.",

      });

    } catch (error) {

      console.error(
        "RESTORE PRODUCT ERROR:",
        error
      );

      return res.status(
        500
      ).json({

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


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
};