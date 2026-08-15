import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  RefreshCw,
  Upload,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService.js";

import "./Products.css";

// =====================================================
// CONSTANTS
// =====================================================

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const MAX_IMAGES = 5;

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// =====================================================
// EMPTY FORM
// =====================================================

const emptyForm = () => ({
  product_type: "",
  product_name: "",
  selling_price: "",
  stock_quantity: 0,
  minimum_stock: 5,
  shop_location: "",
  description: "",
  is_active: true,
});

// =====================================================
// COMPONENT
// =====================================================

function Products() {
  // ===================================================
  // PRODUCTS
  // ===================================================

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  // ===================================================
  // FORM
  // ===================================================

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm());

  const [saving, setSaving] =
    useState(false);

  // ===================================================
  // IMAGES
  // ===================================================

  const [imageItems, setImageItems] =
    useState([]);

  const [dragActive, setDragActive] =
    useState(false);

  const fileInputRef =
    useRef(null);

  // ===================================================
  // VIEW MODAL
  // ===================================================

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  const [imagePreviewOpen, setImagePreviewOpen] =
    useState(false);

  // ===================================================
  // DELETE
  // ===================================================

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  // ===================================================
  // IMAGE URL
  // ===================================================

  const getImageUrl = useCallback(
    (image) => {
      if (!image) {
        return "";
      }

      if (Array.isArray(image)) {
        return image.length
          ? getImageUrl(image[0])
          : "";
      }

      if (
        typeof image === "object"
      ) {
        return getImageUrl(
          image.url ||
            image.imageUrl ||
            image.imageURL ||
            image.path ||
            image.src ||
            ""
        );
      }

      if (
        typeof image !== "string"
      ) {
        return "";
      }

      let value = image.trim();

      if (!value) {
        return "";
      }

      // JSON array
      if (
        value.startsWith("[") &&
        value.endsWith("]")
      ) {
        try {
          const parsed =
            JSON.parse(value);

          if (Array.isArray(parsed)) {
            return getImageUrl(parsed[0]);
          }
        } catch {
          // continue
        }
      }

      // Full URL
      if (
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("data:")
      ) {
        return value;
      }

      // /uploads/products/...
      if (
        value.startsWith("/uploads/")
      ) {
        return `${API_BASE_URL}${value}`;
      }

      // uploads/products/...
      if (
        value.startsWith("uploads/")
      ) {
        return `${API_BASE_URL}/${value}`;
      }

      // filename only
      if (
        !value.startsWith("/")
      ) {
        return `${API_BASE_URL}/uploads/products/${value}`;
      }

      return `${API_BASE_URL}${value}`;
    },
    []
  );

  // ===================================================
  // PRODUCT IMAGES
  // ===================================================

  const getProductImages =
    useCallback(
      (product) => {
        if (!product) {
          return [];
        }

        // -------------------------------------------------
        // Support all common backend image field names.
        // -------------------------------------------------
        const possibleValues = [
          product.images,
          product.product_images,
          product.productImages,
          product.image_urls,
          product.imageUrls,
          product.product_image,
          product.productImage,
          product.image_url,
          product.imageUrl,
          product.image,
        ];

        const images = [];

        const collectImages = (value) => {
          if (!value) {
            return;
          }

          if (Array.isArray(value)) {
            value.forEach(collectImages);
            return;
          }

          if (typeof value === "object") {
            collectImages(
              value.url ||
                value.imageUrl ||
                value.imageURL ||
                value.image_url ||
                value.path ||
                value.src ||
                value.file_path ||
                value.filename ||
                ""
            );
            return;
          }

          if (typeof value !== "string") {
            return;
          }

          const trimmed = value.trim();

          if (!trimmed) {
            return;
          }

          // JSON encoded image array from MySQL.
          if (
            trimmed.startsWith("[") &&
            trimmed.endsWith("]")
          ) {
            try {
              const parsed = JSON.parse(trimmed);

              if (Array.isArray(parsed)) {
                parsed.forEach(collectImages);
                return;
              }
            } catch {
              // Continue as a normal string.
            }
          }

          const url = getImageUrl(trimmed);

          if (url) {
            images.push(url);
          }
        };

        possibleValues.forEach(collectImages);

        return [...new Set(images)];
      },
      [getImageUrl]
    );

  // ===================================================
  // LOAD PRODUCTS
  // ===================================================

  const loadProducts =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getProducts();

        const list =
          Array.isArray(
            response?.products
          )
            ? response.products
            : Array.isArray(
                response?.data
              )
            ? response.data
            : [];

        setProducts(list);
      } catch (err) {
        console.error(
          "Products Error:",
          err
        );

        setError(
          err.message ||
            "Unable to load products."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredProducts =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return products;
      }

      return products.filter(
        (product) => {
          const text = `
            ${product.id || ""}
            ${product.ProductID || ""}
            ${product.product_name || ""}
            ${product.ProductName || ""}
            ${product.product_type || ""}
            ${product.ProductType || ""}
            ${product.shop_location || ""}
            ${product.description || ""}
          `.toLowerCase();

          return text.includes(
            keyword
          );
        }
      );
    }, [products, search]);

  // ===================================================
  // SUMMARY
  // ===================================================

  const totalProducts =
    products.length;

  const activeProducts =
    products.filter(
      (product) =>
        Number(
          product.is_active
        ) === 1 ||
        product.is_active === true
    ).length;

  const lowStock =
    products.filter(
      (product) => {
        const stock =
          Number(
            product.stock_quantity ||
              product.StockQuantity ||
              0
          );

        const minimum =
          Number(
            product.minimum_stock ||
              product.MinimumStock ||
              5
          );

        const active =
          Number(
            product.is_active
          ) === 1 ||
          product.is_active === true;

        return (
          active &&
          stock > 0 &&
          stock <= minimum
        );
      }
    ).length;

  const outOfStock =
    products.filter(
      (product) => {
        const stock =
          Number(
            product.stock_quantity ||
              product.StockQuantity ||
              0
          );

        const active =
          Number(
            product.is_active
          ) === 1 ||
          product.is_active === true;

        return (
          active &&
          stock <= 0
        );
      }
    ).length;

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  };

  // ===================================================
  // OPEN ADD
  // ===================================================

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setImageItems([]);
    setError("");
    setShowForm(true);
  };

  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEditForm =
    (product) => {
      const images =
        getProductImages(product);

      setEditingId(
        product.id ||
          product.ProductID
      );

      setForm({
        product_type:
          product.product_type ||
          product.ProductType ||
          "",

        product_name:
          product.product_name ||
          product.ProductName ||
          "",

        selling_price:
          product.selling_price ??
          product.SellingPrice ??
          product.Price ??
          "",

        stock_quantity:
          product.stock_quantity ??
          product.StockQuantity ??
          product.Stock ??
          0,

        minimum_stock:
          product.minimum_stock ??
          product.MinimumStock ??
          5,

        shop_location:
          product.shop_location ||
          "",

        description:
          product.description ||
          product.Description ||
          "",

        is_active:
          Number(
            product.is_active
          ) === 1 ||
          product.is_active === true,
      });

      setImageItems(
        images.map(
          (url, index) => ({
            id:
              `existing-${Date.now()}-${index}`,
            type: "existing",
            url,
          })
        )
      );

      setError("");
      setShowForm(true);
    };

  // ===================================================
  // CLOSE FORM
  // ===================================================

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    setImageItems([]);
    setDragActive(false);
  };

  // ===================================================
  // VALIDATE IMAGE
  // ===================================================

  const validateImage =
    (file) => {
      if (!file) {
        return false;
      }

      if (
        !ALLOWED_IMAGE_TYPES.includes(
          file.type
        )
      ) {
        alert(
          "Only JPG, JPEG, PNG and WEBP images are allowed."
        );

        return false;
      }

      if (
        file.size >
        MAX_IMAGE_SIZE
      ) {
        alert(
          "Each image must be less than 5MB."
        );

        return false;
      }

      return true;
    };

  // ===================================================
  // ADD IMAGE FILES
  // ===================================================

  const addImageFiles =
    (files) => {
      if (
        !files ||
        files.length === 0
      ) {
        return;
      }

      const remaining =
        MAX_IMAGES -
        imageItems.length;

      if (remaining <= 0) {
        alert(
          `Maximum ${MAX_IMAGES} images are allowed.`
        );

        return;
      }

      const selected =
        Array.from(files).slice(
          0,
          remaining
        );

      const valid =
        selected.filter(
          validateImage
        );

      const newItems =
        valid.map(
          (file) => ({
            id:
              `new-${Date.now()}-${Math.random()}`,
            type: "new",
            file,
            url:
              URL.createObjectURL(
                file
              ),
          })
        );

      setImageItems(
        (previous) => [
          ...previous,
          ...newItems,
        ]
      );
    };

  // ===================================================
  // FILE INPUT
  // ===================================================

  const handleFileInput =
    (event) => {
      addImageFiles(
        event.target.files
      );

      event.target.value = "";
    };

  // ===================================================
  // DRAG OVER
  // ===================================================

  const handleDragOver =
    (event) => {
      event.preventDefault();
      setDragActive(true);
    };

  // ===================================================
  // DRAG LEAVE
  // ===================================================

  const handleDragLeave =
    (event) => {
      event.preventDefault();
      setDragActive(false);
    };

  // ===================================================
  // DROP
  // ===================================================

  const handleDrop =
    (event) => {
      event.preventDefault();

      setDragActive(false);

      addImageFiles(
        event.dataTransfer.files
      );
    };

  // ===================================================
  // REMOVE IMAGE
  // ===================================================

  const removeImage =
    (id) => {
      setImageItems(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== id
          )
      );
    };

  // ===================================================
  // SUBMIT PRODUCT
  // ===================================================

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (
        !form.product_type
      ) {
        alert(
          "Please select product type."
        );

        return;
      }

      if (
        !form.product_name.trim()
      ) {
        alert(
          "Product name is required."
        );

        return;
      }

      if (
        form.selling_price ===
          "" ||
        Number(
          form.selling_price
        ) < 0
      ) {
        alert(
          "Please enter a valid selling price."
        );

        return;
      }

      if (
        form.stock_quantity ===
          "" ||
        Number(
          form.stock_quantity
        ) < 0
      ) {
        alert(
          "Please enter valid stock quantity."
        );

        return;
      }

      if (
        form.minimum_stock ===
          "" ||
        Number(
          form.minimum_stock
        ) < 0
      ) {
        alert(
          "Please enter valid minimum stock."
        );

        return;
      }

      if (
        !form.shop_location
      ) {
        alert(
          "Please select shop location."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");

        const formData =
          new FormData();

        formData.append(
          "product_type",
          form.product_type
        );

        formData.append(
          "product_name",
          form.product_name.trim()
        );

        formData.append(
          "selling_price",
          Number(
            form.selling_price
          )
        );

        formData.append(
          "stock_quantity",
          Number(
            form.stock_quantity
          )
        );

        formData.append(
          "minimum_stock",
          Number(
            form.minimum_stock
          )
        );

        formData.append(
          "shop_location",
          form.shop_location
        );

        formData.append(
          "description",
          form.description.trim()
        );

        formData.append(
          "is_active",
          form.is_active
            ? "1"
            : "0"
        );

        // Existing images for edit
        if (editingId) {
          const existingImages =
            imageItems
              .filter(
                (item) =>
                  item.type ===
                  "existing"
              )
              .map(
                (item) =>
                  item.url
              );

          formData.append(
            "existing_images",
            JSON.stringify(
              existingImages
            )
          );
        }

        // New images
        imageItems
          .filter(
            (item) =>
              item.type === "new" &&
              item.file
          )
          .forEach(
            (item) => {
              formData.append(
                "product_images",
                item.file
              );
            }
          );

        let response;

        if (editingId) {
          response =
            await updateProduct(
              editingId,
              formData
            );
        } else {
          response =
            await createProduct(
              formData
            );
        }

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Unable to save product."
          );
        }

        closeForm();

        await loadProducts();

        alert(
          editingId
            ? "Product updated successfully."
            : "Product added successfully."
        );
      } catch (err) {
        console.error(
          "PRODUCT SAVE ERROR:",
          err
        );

        alert(
          err.message ||
            "Unable to save product."
        );
      } finally {
        setSaving(false);
      }
    };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete =
    async (product) => {
      const id =
        product.id ||
        product.ProductID;

      const name =
        product.product_name ||
        product.ProductName ||
        "this product";

      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${name}"?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeleteLoading(true);

        await deleteProduct(id);

        setProducts(
          (previous) =>
            previous.filter(
              (item) =>
                Number(
                  item.id ||
                    item.ProductID
                ) !== Number(id)
            )
        );

        if (
          selectedProduct &&
          Number(
            selectedProduct.id ||
              selectedProduct.ProductID
          ) === Number(id)
        ) {
          setSelectedProduct(null);
        }

        alert(
          "Product deleted successfully."
        );
      } catch (err) {
        console.error(
          "DELETE PRODUCT ERROR:",
          err
        );

        alert(
          err.message ||
            "Unable to delete product."
        );
      } finally {
        setDeleteLoading(false);
      }
    };

  // ===================================================
  // VIEW PRODUCT
  // ===================================================

  const handleView =
    (product) => {
      setSelectedProduct(
        product
      );

      setSelectedImageIndex(0);

      setImagePreviewOpen(false);
    };

  // ===================================================
  // IMAGE PREVIEW
  // ===================================================

  const openImagePreview =
    (product, index = 0) => {
      setSelectedProduct(
        product
      );

      setSelectedImageIndex(
        index
      );

      setImagePreviewOpen(true);
    };

  const closeImagePreview =
    () => {
      setImagePreviewOpen(false);
      setSelectedImageIndex(0);
    };

  const nextImage = () => {
    if (
      !selectedProduct
    ) {
      return;
    }

    const images =
      getProductImages(
        selectedProduct
      );

    if (
      images.length <= 1
    ) {
      return;
    }

    setSelectedImageIndex(
      (current) =>
        (current + 1) %
        images.length
    );
  };

  const previousImage = () => {
    if (
      !selectedProduct
    ) {
      return;
    }

    const images =
      getProductImages(
        selectedProduct
      );

    if (
      images.length <= 1
    ) {
      return;
    }

    setSelectedImageIndex(
      (current) =>
        current === 0
          ? images.length - 1
          : current - 1
    );
  };

  // ===================================================
  // KEYBOARD
  // ===================================================

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        if (
          !imagePreviewOpen
        ) {
          return;
        }

        if (
          event.key === "Escape"
        ) {
          closeImagePreview();
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          nextImage();
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {
          previousImage();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  });

  // ===================================================
  // PRICE FORMAT
  // ===================================================

  const formatPrice =
    (price) => {
      return Number(
        price || 0
      ).toLocaleString(
        "en-IN",
        {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }
      );
    };

  // ===================================================
  // STOCK STATUS
  // ===================================================

  const getStockStatus =
    (product) => {
      const stock =
        Number(
          product.stock_quantity ||
            product.StockQuantity ||
            0
        );

      const minimum =
        Number(
          product.minimum_stock ||
            product.MinimumStock ||
            5
        );

      if (stock <= 0) {
        return {
          text: "Out of Stock",
          className: "out-stock",
        };
      }

      if (
        stock <= minimum
      ) {
        return {
          text: "Low Stock",
          className: "low-stock",
        };
      }

      return {
        text: "In Stock",
        className: "in-stock",
      };
    };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="products-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="products-header">
        <div>
          <h1>
            Products
          </h1>

          <p>
            Manage your Chashma Plus products.
          </p>
        </div>

        <button
          type="button"
          className="add-product-btn"
          onClick={openAddForm}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="alert alert-error">
          <div>
            <strong>
              Unable to load products
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={loadProducts}
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="summary-grid">

        <div className="summary-card">
          <div>
            <span>
              Total Products
            </span>

            <strong>
              {totalProducts}
            </strong>
          </div>

          <div className="summary-icon teal">
            <Package size={25} />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <span>
              Active Products
            </span>

            <strong>
              {activeProducts}
            </strong>
          </div>

          <div className="summary-icon green">
            <CheckCircle2
              size={25}
            />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <span>
              Low Stock
            </span>

            <strong>
              {lowStock}
            </strong>
          </div>

          <div className="summary-icon orange">
            <AlertTriangle
              size={25}
            />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <span>
              Out of Stock
            </span>

            <strong>
              {outOfStock}
            </strong>
          </div>

          <div className="summary-icon red">
            <XCircle
              size={25}
            />
          </div>
        </div>

      </div>

      {/* =================================================
          PRODUCT LIST
      ================================================= */}

      <div className="product-list-card">

        <div className="product-list-header">
          <div>
            <h2>
              Product List
            </h2>

            <p>
              View and manage all products.
            </p>
          </div>

          <span className="records-badge">
            {filteredProducts.length} Records
          </span>
        </div>

        {/* =================================================
            TOOLBAR
        ================================================= */}

        <div className="product-toolbar">

          <div className="search-box">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search product or location..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                <X size={15} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={loadProducts}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        {loading ? (
          <div className="table-message">
            <RefreshCw
              size={30}
              className="spin"
            />

            <strong>
              Loading products...
            </strong>
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="table-message">
            <Package size={38} />

            <strong>
              {search
                ? "No products found"
                : "No products available"}
            </strong>

            <span>
              {search
                ? "Try another search."
                : "Add your first product."}
            </span>
          </div>
        ) : (
          <div className="table-wrapper">

            <table className="products-table">

              <thead>
                <tr>
                  <th>
                    PRODUCT
                  </th>

                  <th>
                    IMAGES
                  </th>

                  <th>
                    LOCATION
                  </th>

                  <th>
                    PRICE
                  </th>

                  <th>
                    STOCK
                  </th>

                  <th>
                    STATUS
                  </th>

                  <th>
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredProducts.map(
                  (product) => {
                    const id =
                      product.id ||
                      product.ProductID;

                    const name =
                      product.product_name ||
                      product.ProductName ||
                      "Unnamed Product";

                    const type =
                      product.product_type ||
                      product.ProductType ||
                      "";

                    const images =
                      getProductImages(
                        product
                      );

                    const stock =
                      Number(
                        product.stock_quantity ||
                          product.StockQuantity ||
                          0
                      );

                    const price =
                      product.selling_price ||
                      product.SellingPrice ||
                      product.Price ||
                      0;

                    const location =
                      product.shop_location ||
                      "—";

                    const status =
                      getStockStatus(
                        product
                      );

                    return (
                      <tr key={id}>

                        {/* PRODUCT */}

                        <td>
                          <div className="product-name-cell">

                            <div className="product-avatar">
                              {name
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {name}
                              </strong>

                              <span>
                                {type}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* IMAGE */}

                        <td>
                          {images.length >
                          0 ? (
                            <div
                              className="table-product-image clickable"
                              onClick={() =>
                                openImagePreview(
                                  product,
                                  0
                                )
                              }
                            >
                              <img
                                src={
                                  images[0]
                                }
                                alt={
                                  name
                                }
                              />

                              {images.length >
                                1 && (
                                <span className="image-count">
                                  +
                                  {images.length -
                                    1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="table-no-image">
                              <ImageIcon
                                size={20}
                              />
                            </div>
                          )}
                        </td>

                        {/* LOCATION */}

                        <td>
                          <span className="location-badge">
                            <MapPin
                              size={13}
                            />

                            {location}
                          </span>
                        </td>

                        {/* PRICE */}

                        <td>
                          <span className="price-value">
                            {formatPrice(
                              price
                            )}
                          </span>
                        </td>

                        {/* STOCK */}

                        <td>
                          <span
                            className={`stock-value ${status.className}`}
                          >
                            {stock}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`status-badge ${status.className}`}
                          >
                            <span />
                            {status.text}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="action-buttons">

                            <button
                              type="button"
                              className="icon-action view"
                              title="View"
                              onClick={() =>
                                handleView(
                                  product
                                )
                              }
                            >
                              <Eye
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              className="icon-action edit"
                              title="Edit"
                              onClick={() =>
                                openEditForm(
                                  product
                                )
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <button
                              type="button"
                              className="icon-action delete"
                              title="Delete"
                              disabled={
                                deleteLoading
                              }
                              onClick={() =>
                                handleDelete(
                                  product
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =================================================
          VIEW PRODUCT MODAL
      ================================================= */}

      {selectedProduct &&
        !imagePreviewOpen && (
          <div
            className="modal-overlay"
            onClick={() =>
              setSelectedProduct(
                null
              )
            }
          >
            <div
              className="view-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="modal-header">
                <div>
                  <h2>
                    Product Details
                  </h2>

                  <p>
                    View product information.
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setSelectedProduct(
                      null
                    )
                  }
                >
                  <X size={19} />
                </button>
              </div>

              <div className="view-content">

                <div className="view-image-grid">

                  {getProductImages(
                    selectedProduct
                  ).length > 0 ? (
                    getProductImages(
                      selectedProduct
                    ).map(
                      (
                        image,
                        index
                      ) => (
                        <img
                          key={image}
                          src={image}
                          alt={`Product ${
                            index + 1
                          }`}
                          onClick={() =>
                            openImagePreview(
                              selectedProduct,
                              index
                            )
                          }
                        />
                      )
                    )
                  ) : (
                    <div className="view-no-image">
                      <ImageIcon
                        size={45}
                      />

                      <span>
                        No image available
                      </span>
                    </div>
                  )}

                </div>

                <div className="detail-grid">

                  <div>
                    <span>
                      Product Type
                    </span>

                    <strong>
                      {selectedProduct.product_type ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Product Name
                    </span>

                    <strong>
                      {selectedProduct.product_name ||
                        "—"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Price
                    </span>

                    <strong>
                      {formatPrice(
                        selectedProduct.selling_price
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Stock
                    </span>

                    <strong>
                      {selectedProduct.stock_quantity ??
                        0}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Minimum Stock
                    </span>

                    <strong>
                      {selectedProduct.minimum_stock ??
                        5}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Shop Location
                    </span>

                    <strong>
                      {selectedProduct.shop_location ||
                        "—"}
                    </strong>
                  </div>

                </div>

                {selectedProduct.description && (
                  <div className="detail-description">
                    <span>
                      Description
                    </span>

                    <p>
                      {
                        selectedProduct.description
                      }
                    </p>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

      {/* =================================================
          FULL IMAGE PREVIEW
      ================================================= */}

      {imagePreviewOpen &&
        selectedProduct && (
          <div
            className="image-preview-overlay"
            onClick={
              closeImagePreview
            }
          >

            <button
              type="button"
              className="image-preview-close"
              onClick={
                closeImagePreview
              }
            >
              <X size={25} />
            </button>

            {getProductImages(
              selectedProduct
            ).length > 1 && (
              <button
                type="button"
                className="image-nav previous"
                onClick={(event) => {
                  event.stopPropagation();
                  previousImage();
                }}
              >
                <ChevronLeft
                  size={30}
                />
              </button>
            )}

            <div
              className="image-preview-content"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <img
                src={
                  getProductImages(
                    selectedProduct
                  )[
                    selectedImageIndex
                  ]
                }
                alt={
                  selectedProduct.product_name
                }
              />

              <div className="image-preview-caption">
                <strong>
                  {
                    selectedProduct.product_name
                  }
                </strong>

                <span>
                  {selectedImageIndex +
                    1}
                  {" / "}
                  {
                    getProductImages(
                      selectedProduct
                    ).length
                  }
                </span>
              </div>
            </div>

            {getProductImages(
              selectedProduct
            ).length > 1 && (
              <button
                type="button"
                className="image-nav next"
                onClick={(event) => {
                  event.stopPropagation();
                  nextImage();
                }}
              >
                <ChevronRight
                  size={30}
                />
              </button>
            )}

          </div>
        )}

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showForm && (
        <div
          className="modal-overlay"
          onClick={closeForm}
        >
          <div
            className="product-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="modal-header">
              <div>
                <h2>
                  {editingId
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p>
                  {editingId
                    ? "Update product information and images."
                    : "Add a new product to your inventory."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeForm}
                disabled={saving}
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}

            <form
              className="product-form"
              onSubmit={handleSubmit}
            >

              {/* PRODUCT TYPE */}

              <div className="form-group">
                <label>
                  Product Type *
                </label>

                <select
                  name="product_type"
                  value={
                    form.product_type
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  <option value="">
                    Select Product Type
                  </option>

                  <option value="Frame">
                    Frame
                  </option>

                  <option value="Sunglass">
                    Sunglass
                  </option>
                </select>
              </div>

              {/* PRODUCT NAME */}

              <div className="form-group">
                <label>
                  Product Name *
                </label>

                <input
                  type="text"
                  name="product_name"
                  value={
                    form.product_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter product name"
                  required
                />
              </div>

              {/* PRICE */}

              <div className="form-group">
                <label>
                  Selling Price *
                </label>

                <input
                  type="number"
                  name="selling_price"
                  min="0"
                  step="0.01"
                  value={
                    form.selling_price
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="₹ 0.00"
                  required
                />
              </div>

              {/* STOCK */}

              <div className="form-group">
                <label>
                  Stock Quantity *
                </label>

                <input
                  type="number"
                  name="stock_quantity"
                  min="0"
                  value={
                    form.stock_quantity
                  }
                  onChange={
                    handleChange
                  }
                  required
                />

                <small>
                  Current available stock
                </small>
              </div>

              {/* MINIMUM STOCK */}

              <div className="form-group">
                <label>
                  Minimum Stock
                </label>

                <input
                  type="number"
                  name="minimum_stock"
                  min="0"
                  value={
                    form.minimum_stock
                  }
                  onChange={
                    handleChange
                  }
                />

                <small>
                  Used for low-stock alert
                </small>
              </div>

              {/* LOCATION */}

              <div className="form-group">
                <label>
                  Shop Location *
                </label>

                <select
                  name="shop_location"
                  value={
                    form.shop_location
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  <option value="">
                    Select Shop Location
                  </option>

                  <option value="Telibag">
                    Telibag
                  </option>

                  <option value="Arjunganj">
                    Arjunganj
                  </option>
                </select>
              </div>

              {/* DESCRIPTION */}

              <div className="form-group full-width">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  rows="4"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter product description..."
                />
              </div>

              {/* IMAGE UPLOAD */}

              <div className="form-group full-width">

                <div className="image-upload-heading">
                  <div>
                    <label>
                      Product Images
                    </label>

                    <small>
                      Upload up to 5 images. Each image must be below 5MB.
                    </small>
                  </div>

                  <span className="image-counter">
                    {imageItems.length} /{" "}
                    {MAX_IMAGES}
                  </span>
                </div>

                <div
                  className={
                    dragActive
                      ? "image-upload-area drag-active"
                      : "image-upload-area"
                  }
                  onDragOver={
                    handleDragOver
                  }
                  onDragLeave={
                    handleDragLeave
                  }
                  onDrop={
                    handleDrop
                  }
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                    onChange={
                      handleFileInput
                    }
                  />

                  <div className="upload-circle">
                    <Upload
                      size={27}
                    />
                  </div>

                  <strong>
                    Drag & Drop product images
                  </strong>

                  <span>
                    or{" "}
                    <b>
                      click to browse
                    </b>
                  </span>

                  <small>
                    JPG, JPEG, PNG or WEBP
                    {" • "}
                    Max 5MB each
                  </small>

                </div>

                {/* IMAGE PREVIEWS */}

                {imageItems.length >
                  0 && (
                  <div className="uploaded-images">

                    {imageItems.map(
                      (
                        image,
                        index
                      ) => (
                        <div
                          className="uploaded-image-card"
                          key={
                            image.id
                          }
                        >

                          <img
                            src={
                              image.type ===
                              "existing"
                                ? getImageUrl(
                                    image.url
                                  )
                                : image.url
                            }
                            alt={`Product ${
                              index + 1
                            }`}
                          />

                          <span className="image-number">
                            {index + 1}
                          </span>

                          {index ===
                            0 && (
                            <span className="primary-badge">
                              Main
                            </span>
                          )}

                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() =>
                              removeImage(
                                image.id
                              )
                            }
                          >
                            <X
                              size={15}
                            />
                          </button>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

              {/* ACTIVE */}

              <div className="form-group full-width">

                <label className="active-checkbox">

                  <input
                    type="checkbox"
                    name="is_active"
                    checked={
                      form.is_active
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span className="custom-checkbox">
                    {form.is_active &&
                      "✓"}
                  </span>

                  <strong>
                    Product is active
                  </strong>

                </label>

              </div>

              {/* FOOTER */}

              <div className="form-footer">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closeForm
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-product-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2
                        size={16}
                      />

                      {editingId
                        ? "Update Product"
                        : "Add Product"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default Products;