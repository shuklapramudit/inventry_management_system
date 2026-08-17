import React, { useEffect, useMemo, useState } from "react";

import "./Inventory.css";

import {
  getInventory,
  addPurchase,
  adjustStock,
} from "../services/inventoryService.js";


// =====================================================
// API
// =====================================================

// Vercel / Render production API
const API =
  (
    import.meta.env.VITE_API_URL ||
    "https://inventry-management-system-1-obf0.onrender.com/api"
  )
    .trim()
    .replace(/\/+$/, "");


// =====================================================
// SERVER URL
// =====================================================

// Prefer VITE_SERVER_URL if available.
//
// Otherwise automatically derive:
// https://server.com/api
//        ↓
// https://server.com
//
// This prevents:
// undefined/uploads/...
//
const SERVER_URL =
  (
    import.meta.env.VITE_SERVER_URL ||
    API.replace(/\/api$/i, "")
  )
    .trim()
    .replace(/\/+$/, "");


export { API, SERVER_URL };


// =====================================================
// IMAGE URL HELPER
// =====================================================

const getImageUrl = (image) => {

  if (!image) {
    return "";
  }

  let imageValue = image;


  // -----------------------------------------------
  // OBJECT IMAGE
  // -----------------------------------------------

  if (typeof imageValue === "object") {

    imageValue =
      imageValue.url ||
      imageValue.image ||
      imageValue.imageUrl ||
      imageValue.imageURL ||
      imageValue.ImageURL ||
      imageValue.product_image ||
      imageValue.productImage ||
      "";
  }


  if (!imageValue) {
    return "";
  }


  imageValue = String(imageValue).trim();


  if (!imageValue) {
    return "";
  }


  // -----------------------------------------------
  // JSON STRING
  // -----------------------------------------------

  if (
    imageValue.startsWith("[") &&
    imageValue.endsWith("]")
  ) {

    try {

      const parsed =
        JSON.parse(imageValue);

      if (
        Array.isArray(parsed) &&
        parsed.length > 0
      ) {
        return getImageUrl(parsed[0]);
      }

    } catch {
      // Continue normally
    }
  }


  // -----------------------------------------------
  // FULL URL
  // -----------------------------------------------

  if (
    imageValue.startsWith("http://") ||
    imageValue.startsWith("https://") ||
    imageValue.startsWith("data:")
  ) {

    return imageValue;
  }


  // -----------------------------------------------
  // /uploads/...
  // -----------------------------------------------

  if (
    imageValue.startsWith("/uploads/")
  ) {

    return `${SERVER_URL}${imageValue}`;
  }


  // -----------------------------------------------
  // uploads/...
  // -----------------------------------------------

  if (
    imageValue.startsWith("uploads/")
  ) {

    return `${SERVER_URL}/${imageValue}`;
  }


  // -----------------------------------------------
  // /products/...
  // -----------------------------------------------

  if (
    imageValue.startsWith("/products/")
  ) {

    return `${SERVER_URL}/uploads${imageValue}`;
  }


  // -----------------------------------------------
  // products/...
  // -----------------------------------------------

  if (
    imageValue.startsWith("products/")
  ) {

    return `${SERVER_URL}/uploads/${imageValue}`;
  }


  // -----------------------------------------------
  // FILENAME ONLY
  // -----------------------------------------------

  if (
    !imageValue.startsWith("/") &&
    !imageValue.includes("://")
  ) {

    return `${SERVER_URL}/uploads/${imageValue}`;
  }


  return imageValue;
};


// =====================================================
// INVENTORY PAGE
// =====================================================

const Inventory = () => {


  // ===================================================
  // STATE
  // ===================================================

  const [inventory, setInventory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [showPurchaseModal, setShowPurchaseModal] =
    useState(false);

  const [showAdjustModal, setShowAdjustModal] =
    useState(false);

  const [selectedItem, setSelectedItem] =
    useState(null);


  // ===================================================
  // PURCHASE FORM
  // ===================================================

  const [purchaseForm, setPurchaseForm] =
    useState({
      product_id: "",
      quantity: "",
      purchase_price: "",
      purchase_date: "",
      notes: "",
    });


  // ===================================================
  // ADJUSTMENT FORM
  // ===================================================

  const [adjustForm, setAdjustForm] =
    useState({
      quantity: "",
      notes: "",
    });


  // ===================================================
  // TOKEN
  // ===================================================

  const getToken = () => {

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  };


  // ===================================================
  // HEADERS
  // ===================================================

  const getHeaders = (json = false) => {

    const token = getToken();

    return {

      ...(json
        ? {
            "Content-Type":
              "application/json",
          }
        : {}),

      ...(token
        ? {
            Authorization:
              `Bearer ${token}`,
          }
        : {}),
    };
  };


  // ===================================================
  // API RESPONSE
  // ===================================================

  const getErrorMessage = (
    result,
    fallback
  ) => {

    return (
      result?.message ||
      result?.error ||
      fallback
    );
  };


  // ===================================================
  // NORMALIZE INVENTORY
  // ===================================================

  const normalizeInventoryItem = (
    item
  ) => {

    const rawImage =
      item.product_image ??
      item.productImage ??
      item.ImageURL ??
      item.imageURL ??
      item.imageUrl ??
      item.image ??
      item.ProductImage ??
      "";


    const productImage =
      getImageUrl(rawImage);


    return {

      ...item,

      id:
        item.id ??
        item.inventory_id ??
        item.InventoryID ??
        null,

      productId:
        item.product_id ??
        item.productId ??
        item.ProductID ??
        null,

      productType:
        item.product_type ??
        item.productType ??
        item.ProductType ??
        "-",

      productName:
        item.product_name ??
        item.productName ??
        item.ProductName ??
        "Unknown Product",

      // Browser-ready image URL
      productImage,

      shopLocation:
        item.shop_location ??
        item.shopLocation ??
        item.ShopLocation ??
        "-",

      purchasedQuantity:
        Number(
          item.purchased_quantity ??
          item.purchasedQuantity ??
          item.PurchasedQuantity ??
          0
        ),

      soldQuantity:
        Number(
          item.sold_quantity ??
          item.soldQuantity ??
          item.SoldQuantity ??
          0
        ),

      currentStock:
        Number(
          item.current_stock ??
          item.currentStock ??
          item.CurrentStock ??
          0
        ),

      lowStockLimit:
        Number(
          item.low_stock_limit ??
          item.lowStockLimit ??
          item.minimum_stock ??
          item.minimumStock ??
          item.MinimumStock ??
          0
        ),

      isLowStock:
        Boolean(item.is_low_stock) ||
        Boolean(item.isLowStock),

      updatedAt:
        item.updated_at ??
        item.updatedAt ??
        null,
    };
  };


  // ===================================================
  // FETCH INVENTORY
  // ===================================================

  const fetchInventory = async () => {

    const result =
      await getInventory();


    const records =
      Array.isArray(result?.inventory)
        ? result.inventory
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];


    console.log(
      "Inventory API:",
      result
    );


    console.log(
      "Inventory Records:",
      records
    );


    setInventory(
      records.map(
        normalizeInventoryItem
      )
    );
  };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    const loadInventory =
      async () => {

        try {

          setLoading(true);

          setError("");

          await fetchInventory();

        } catch (err) {

          console.error(
            "Inventory Fetch Error:",
            err
          );

          setError(
            err.message ||
            "Unable to load inventory."
          );

        } finally {

          setLoading(false);
        }
      };


    loadInventory();

  }, []);


  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = async () => {

    try {

      setRefreshing(true);

      setError("");

      setSuccess("");


      await fetchInventory();


      setSuccess(
        "Inventory refreshed successfully."
      );

    } catch (err) {

      console.error(
        "Inventory Refresh Error:",
        err
      );

      setError(
        err.message ||
        "Unable to refresh inventory."
      );

    } finally {

      setRefreshing(false);
    }
  };


  // ===================================================
  // SEARCH + FILTER
  // ===================================================

  const filteredInventory =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return inventory.filter(
        (item) => {

          const matchesSearch =
            !query ||
            [
              item.productName,
              item.productType,
              item.shopLocation,
              item.productId,
            ].some(
              (value) =>
                String(value ?? "")
                  .toLowerCase()
                  .includes(query)
            );


          let matchesStatus =
            true;


          if (
            statusFilter === "low"
          ) {

            matchesStatus =
              item.currentStock <=
              item.lowStockLimit;
          }


          if (
            statusFilter === "out"
          ) {

            matchesStatus =
              item.currentStock <= 0;
          }


          if (
            statusFilter === "available"
          ) {

            matchesStatus =
              item.currentStock >
              item.lowStockLimit;
          }


          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      inventory,
      search,
      statusFilter,
    ]);


  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    useMemo(() => {

      const totalProducts =
        inventory.length;


      const totalStock =
        inventory.reduce(
          (total, item) =>
            total +
            Number(
              item.currentStock || 0
            ),
          0
        );


      const totalPurchased =
        inventory.reduce(
          (total, item) =>
            total +
            Number(
              item.purchasedQuantity || 0
            ),
          0
        );


      const totalSold =
        inventory.reduce(
          (total, item) =>
            total +
            Number(
              item.soldQuantity || 0
            ),
          0
        );


      const lowStock =
        inventory.filter(
          (item) =>
            item.currentStock <=
            item.lowStockLimit
        ).length;


      const outOfStock =
        inventory.filter(
          (item) =>
            item.currentStock <= 0
        ).length;


      return {

        totalProducts,

        totalStock,

        totalPurchased,

        totalSold,

        lowStock,

        outOfStock,

      };

    }, [inventory]);


  // ===================================================
  // STOCK STATUS
  // ===================================================

  const getStockStatus = (
    item
  ) => {

    if (
      item.currentStock <= 0
    ) {

      return {
        label:
          "Out of Stock",
        className:
          "out",
      };
    }


    if (
      item.currentStock <=
      item.lowStockLimit
    ) {

      return {
        label:
          "Low Stock",
        className:
          "low",
      };
    }


    return {
      label:
        "In Stock",
      className:
        "good",
    };
  };


  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (
    date
  ) => {

    if (!date) {
      return "-";
    }


    const parsed =
      new Date(date);


    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {

      return "-";
    }


    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  // ===================================================
  // FORMAT CURRENCY
  // ===================================================

  const formatCurrency = (
    value
  ) => {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(
      Number(value || 0)
    );
  };


  // ===================================================
  // OPEN PURCHASE MODAL
  // ===================================================

  const openPurchaseModal =
    () => {

      setError("");

      setSuccess("");

      setSelectedItem(null);


      setPurchaseForm({
        product_id: "",
        quantity: "",
        purchase_price: "",
        purchase_date: "",
        notes: "",
      });


      setShowPurchaseModal(
        true
      );
    };


  // ===================================================
  // OPEN PURCHASE FOR PRODUCT
  // ===================================================

  const openPurchaseForProduct =
    (item) => {

      setError("");

      setSuccess("");

      setSelectedItem(item);


      setPurchaseForm({

        product_id:
          item.productId
            ? String(item.productId)
            : "",

        quantity: "",

        purchase_price: "",

        purchase_date: "",

        notes: "",
      });


      setShowPurchaseModal(
        true
      );
    };


  // ===================================================
  // CLOSE PURCHASE
  // ===================================================

  const closePurchaseModal =
    () => {

      if (saving) {
        return;
      }


      setShowPurchaseModal(
        false
      );

      setSelectedItem(null);
    };


  // ===================================================
  // PURCHASE CHANGE
  // ===================================================

  const handlePurchaseChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      setPurchaseForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  // ===================================================
  // PURCHASE SUBMIT
  // ===================================================

  const handlePurchaseSubmit =
    async (event) => {

      event.preventDefault();


      setError("");

      setSuccess("");


      const productId =
        Number(
          purchaseForm.product_id
        );


      const quantity =
        Number(
          purchaseForm.quantity
        );


      const purchasePrice =
        purchaseForm.purchase_price === ""
          ? 0
          : Number(
              purchaseForm.purchase_price
            );


      if (
        !Number.isInteger(
          productId
        ) ||
        productId <= 0
      ) {

        setError(
          "Please select a valid product."
        );

        return;
      }


      if (
        !Number.isInteger(
          quantity
        ) ||
        quantity <= 0
      ) {

        setError(
          "Purchase quantity must be greater than 0."
        );

        return;
      }


      if (
        Number.isNaN(
          purchasePrice
        ) ||
        purchasePrice < 0
      ) {

        setError(
          "Please enter a valid purchase price."
        );

        return;
      }


      try {

        setSaving(true);


        const payload = {

          product_id:
            productId,

          quantity:
            quantity,

          purchase_price:
            purchasePrice,

          purchase_date:
            purchaseForm.purchase_date ||
            null,

          notes:
            purchaseForm.notes.trim() ||
            null,
        };


        const result =
          await addPurchase(
            payload
          );


        setShowPurchaseModal(
          false
        );


        setSuccess(
          result?.message ||
          "Stock added successfully."
        );


        setPurchaseForm({
          product_id: "",
          quantity: "",
          purchase_price: "",
          purchase_date: "",
          notes: "",
        });


        setSelectedItem(null);


        await fetchInventory();

      } catch (err) {

        console.error(
          "Purchase Error:",
          err
        );


        setError(
          err.message ||
          "Unable to add stock."
        );

      } finally {

        setSaving(false);
      }
    };


  // ===================================================
  // OPEN ADJUSTMENT
  // ===================================================

  const openAdjustModal =
    (item) => {

      setSelectedItem(item);


      setAdjustForm({
        quantity: "",
        notes: "",
      });


      setError("");

      setSuccess("");


      setShowAdjustModal(
        true
      );
    };


  // ===================================================
  // CLOSE ADJUSTMENT
  // ===================================================

  const closeAdjustModal =
    () => {

      if (saving) {
        return;
      }


      setShowAdjustModal(
        false
      );


      setSelectedItem(null);


      setAdjustForm({
        quantity: "",
        notes: "",
      });
    };


  // ===================================================
  // ADJUSTMENT CHANGE
  // ===================================================

  const handleAdjustChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      setAdjustForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  // ===================================================
  // STOCK ADJUSTMENT
  // ===================================================

  const handleAdjustSubmit =
    async (event) => {

      event.preventDefault();


      if (!selectedItem) {
        return;
      }


      setError("");

      setSuccess("");


      const adjustment =
        Number(
          adjustForm.quantity
        );


      if (
        !Number.isInteger(
          adjustment
        ) ||
        adjustment === 0
      ) {

        setError(
          "Adjustment must be a non-zero whole number."
        );

        return;
      }


      const newStock =
        selectedItem.currentStock +
        adjustment;


      if (newStock < 0) {

        setError(
          `Stock cannot become negative. Current stock is ${selectedItem.currentStock}.`
        );

        return;
      }


      try {

        setSaving(true);


        const result =
          await adjustStock(
            selectedItem.productId,
            {
              quantity:
                adjustment,

              notes:
                adjustForm.notes.trim() ||
                null,
            }
          );


        setShowAdjustModal(
          false
        );


        setSuccess(
          result?.message ||
          "Stock adjusted successfully."
        );


        setSelectedItem(
          null
        );


        setAdjustForm({
          quantity: "",
          notes: "",
        });


        await fetchInventory();

      } catch (err) {

        console.error(
          "Stock Adjustment Error:",
          err
        );


        setError(
          err.message ||
          "Unable to adjust stock."
        );

      } finally {

        setSaving(false);
      }
    };


  // ===================================================
  // IMAGE ERROR HANDLER
  // ===================================================

  const handleImageError =
    (event) => {

      console.error(
        "Inventory product image failed:",
        event.currentTarget.src
      );


      event.currentTarget.style.display =
        "none";


      const fallback =
        event.currentTarget
          .parentElement
          ?.querySelector(
            ".product-image-fallback"
          );


      if (fallback) {

        fallback.style.display =
          "flex";
      }
    };


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div className="inventory-page">


      {/* =================================================
          HEADER
          ================================================= */}

      <div className="inventory-header">

        <div>

          <h1>
            Inventory
          </h1>

          <p>
            Monitor stock, purchases and inventory movements.
          </p>

        </div>


        <div className="inventory-header-actions">

          <button
            type="button"
            className="inventory-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >

            <span>
              {refreshing
                ? "↻"
                : "⟳"}
            </span>

            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>


          <button
            type="button"
            className="inventory-purchase-btn"
            onClick={
              openPurchaseModal
            }
          >

            <span>
              +
            </span>

            Add Purchase

          </button>

        </div>

      </div>


      {/* =================================================
          ALERTS
          ================================================= */}

      {error && (

        <div className="inventory-alert error">

          <span className="alert-icon">
            !
          </span>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>

        </div>
      )}


      {success && (

        <div className="inventory-alert success">

          <span className="alert-icon">
            ✓
          </span>

          <p>
            {success}
          </p>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >
            ×
          </button>

        </div>
      )}


      {/* =================================================
          SUMMARY
          ================================================= */}

      <div className="inventory-summary">

        <div className="inventory-summary-card">

          <div className="summary-icon">
            ▤
          </div>

          <div>

            <span>
              Products
            </span>

            <strong>
              {summary.totalProducts}
            </strong>

          </div>

        </div>


        <div className="inventory-summary-card">

          <div className="summary-icon">
            #
          </div>

          <div>

            <span>
              Current Stock
            </span>

            <strong>
              {summary.totalStock}
            </strong>

          </div>

        </div>


        <div className="inventory-summary-card">

          <div className="summary-icon">
            +
          </div>

          <div>

            <span>
              Purchased
            </span>

            <strong>
              {summary.totalPurchased}
            </strong>

          </div>

        </div>


        <div className="inventory-summary-card">

          <div className="summary-icon">
            −
          </div>

          <div>

            <span>
              Sold
            </span>

            <strong>
              {summary.totalSold}
            </strong>

          </div>

        </div>


        <div className="inventory-summary-card warning-card">

          <div className="summary-icon">
            !
          </div>

          <div>

            <span>
              Low Stock
            </span>

            <strong>
              {summary.lowStock}
            </strong>

          </div>

        </div>


        <div className="inventory-summary-card danger-card">

          <div className="summary-icon">
            0
          </div>

          <div>

            <span>
              Out of Stock
            </span>

            <strong>
              {summary.outOfStock}
            </strong>

          </div>

        </div>

      </div>


      {/* =================================================
          MAIN CARD
          ================================================= */}

      <div className="inventory-card">


        {/* CARD HEADER */}

        <div className="inventory-card-header">

          <div>

            <h2>
              Inventory Items
            </h2>

            <p>
              Current inventory records from your database.
            </p>

          </div>


          <span className="inventory-record-count">

            {filteredInventory.length}
            {" "}
            Records

          </span>

        </div>


        {/* =================================================
            TOOLBAR
            ================================================= */}

        <div className="inventory-toolbar">

          <div className="inventory-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search product, type or shop..."
            />

            {search && (

              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>

            )}

          </div>


          <select
            className="inventory-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >

            <option value="all">
              All Stock
            </option>

            <option value="available">
              In Stock
            </option>

            <option value="low">
              Low Stock
            </option>

            <option value="out">
              Out of Stock
            </option>

          </select>


          <span className="inventory-showing">

            Showing{" "}
            {filteredInventory.length}
            {" "}
            of{" "}
            {inventory.length}

          </span>

        </div>


        {/* =================================================
            LOADING / EMPTY / DATA
            ================================================= */}

        {loading ? (

          <div className="inventory-loading">

            <div className="inventory-spinner"></div>

            <p>
              Loading inventory...
            </p>

          </div>

        ) : filteredInventory.length === 0 ? (

          <div className="inventory-empty">

            <div className="empty-icon">
              ▤
            </div>

            <h3>

              {search ||
              statusFilter !== "all"
                ? "No inventory found"
                : "No inventory records"}

            </h3>

            <p>

              {search ||
              statusFilter !== "all"
                ? "Try changing your search or filter."
                : "Inventory records will appear after products are added."}

            </p>

          </div>

        ) : (

          <>

            {/* =================================================
                DESKTOP TABLE
                ================================================= */}

            <div className="inventory-table-wrapper">

              <table className="inventory-table">

                <thead>

                  <tr>

                    <th>
                      Product
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Shop
                    </th>
{/* 
                    <th>
                      Purchased
                    </th> */}

                    <th>
                      Total Inn
                    </th>

                    <th>
                      sold
                    </th>

                    {/* <th>
                      Min Stock
                    </th> */}

                    <th>
                      Status
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredInventory.map(
                    (item) => {

                      const status =
                        getStockStatus(
                          item
                        );


                      return (

                        <tr
                          key={
                            item.id ??
                            item.productId
                          }
                        >


                          {/* PRODUCT */}

                          <td>

                            <div className="inventory-product">

                              <div className="product-icon">

                                {item.productImage ? (

                                  <img
                                    src={
                                      item.productImage
                                    }
                                    alt={
                                      item.productName ||
                                      "Product"
                                    }
                                    loading="lazy"
                                    onError={
                                      handleImageError
                                    }
                                  />

                                ) : null}


                                <span
                                  className="product-image-fallback"
                                  style={{
                                    display:
                                      item.productImage
                                        ? "none"
                                        : "flex",
                                  }}
                                >
                                  ▣
                                </span>

                              </div>


                              <div>

                                <strong>
                                  {item.productName}
                                </strong>

                                <small>
                                  ID:{" "}
                                  {item.productId}
                                </small>

                              </div>

                            </div>

                          </td>


                          {/* TYPE */}

                          <td>

                            <span className="product-type">
                              {item.productType}
                            </span>

                          </td>


                          {/* SHOP */}

                          <td>

                            <span className="shop-location">
                              {item.shopLocation}
                            </span>

                          </td>


                          {/* PURCHASED */}

                          <td>

                            <strong className="quantity-value">
                              {item.purchasedQuantity}
                            </strong>

                          </td>


                          {/* SOLD */}

                          <td>

                            <strong className="quantity-value">
                              {item.soldQuantity}
                            </strong>

                          </td>


                          {/* CURRENT STOCK */}

                          <td>

                            <div className="current-stock">

                              <strong>
                                {item.currentStock}
                              </strong>


                              <div className="stock-progress">

                                <span
                                  style={{
                                    width:
                                      `${Math.min(
                                        100,
                                        Math.max(
                                          0,
                                          item.currentStock
                                        )
                                      )}%`,
                                  }}
                                />

                              </div>

                            </div>

                          </td>


                          {/* MIN */}

                          {/* <td>
                            {item.lowStockLimit}
                          </td> */}


                          {/* STATUS */}

                          <td>

                            <span
                              className={
                                `stock-status ${status.className}`
                              }
                            >

                              <span></span>

                              {status.label}

                            </span>

                          </td>


                          {/* ACTIONS */}

                          <td>

                            <div className="inventory-actions">

                              <button
                                type="button"
                                className="purchase-small-btn"
                                onClick={() =>
                                  openPurchaseForProduct(
                                    item
                                  )
                                }
                              >
                                + Stock
                              </button>


                              <button
                                type="button"
                                className="adjust-small-btn"
                                onClick={() =>
                                  openAdjustModal(
                                    item
                                  )
                                }
                              >
                                Adjust
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


            {/* =================================================
                MOBILE CARDS
                ================================================= */}

            <div className="inventory-mobile-list">

              {filteredInventory.map(
                (item) => {

                  const status =
                    getStockStatus(
                      item
                    );


                  return (

                    <div
                      className="inventory-mobile-card"
                      key={
                        item.id ??
                        item.productId
                      }
                    >

                      <div className="mobile-product-header">

                        <div className="inventory-product">

                          <div className="product-icon">

                            {item.productImage ? (

                              <img
                                src={
                                  item.productImage
                                }
                                alt={
                                  item.productName ||
                                  "Product"
                                }
                                loading="lazy"
                                onError={
                                  handleImageError
                                }
                              />

                            ) : null}


                            <span
                              className="product-image-fallback"
                              style={{
                                display:
                                  item.productImage
                                    ? "none"
                                    : "flex",
                              }}
                            >
                              ▣
                            </span>

                          </div>


                          <div>

                            <strong>
                              {item.productName}
                            </strong>

                            <small>
                              ID:{" "}
                              {item.productId}
                            </small>

                          </div>

                        </div>


                        <span
                          className={
                            `stock-status ${status.className}`
                          }
                        >

                          <span></span>

                          {status.label}

                        </span>

                      </div>


                      <div className="mobile-inventory-details">

                        <div>

                          <span>
                            Product Type
                          </span>

                          <strong>
                            {item.productType}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Shop
                          </span>

                          <strong>
                            {item.shopLocation}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Purchased
                          </span>

                          <strong>
                            {item.purchasedQuantity}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Sold
                          </span>

                          <strong>
                            {item.soldQuantity}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Current Stock
                          </span>

                          <strong>
                            {item.currentStock}
                          </strong>

                        </div>


                        <div>

                          <span>
                            Minimum Stock
                          </span>

                          <strong>
                            {item.lowStockLimit}
                          </strong>

                        </div>

                      </div>


                      <div className="mobile-inventory-actions">

                        <button
                          type="button"
                          className="purchase-mobile-btn"
                          onClick={() =>
                            openPurchaseForProduct(
                              item
                            )
                          }
                        >
                          + Add Stock
                        </button>


                        <button
                          type="button"
                          className="adjust-mobile-btn"
                          onClick={() =>
                            openAdjustModal(
                              item
                            )
                          }
                        >
                          Adjust Stock
                        </button>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          </>

        )}

      </div>


      {/* =================================================
          PURCHASE MODAL
          ================================================= */}

      {showPurchaseModal && (

        <div
          className="inventory-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closePurchaseModal();
            }

          }}
        >

          <div className="inventory-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Add Purchase
                </h2>

                <p>
                  Add purchased quantity to inventory.
                </p>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closePurchaseModal
                }
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              className="inventory-form"
              onSubmit={
                handlePurchaseSubmit
              }
            >


              {/* PRODUCT */}

              <div className="form-group">

                <label>

                  Product

                  <span>
                    *
                  </span>

                </label>


                <select
                  name="product_id"
                  value={
                    purchaseForm.product_id
                  }
                  onChange={
                    handlePurchaseChange
                  }
                  required
                >

                  <option value="">
                    Select product
                  </option>


                  {inventory.map(
                    (item) => (

                      <option
                        key={
                          item.productId
                        }
                        value={
                          item.productId
                        }
                      >

                        {item.productName}
                        {" — Stock: "}
                        {item.currentStock}

                      </option>

                    )
                  )}

                </select>

              </div>


              {/* SELECTED PRODUCT INFO */}

              {selectedItem && (

                <div className="selected-product-box">

                  <strong>
                    {selectedItem.productName}
                  </strong>

                  <span>
                    Current Stock:{" "}
                    {selectedItem.currentStock}
                  </span>

                  <span>
                    Shop:{" "}
                    {selectedItem.shopLocation}
                  </span>

                </div>

              )}


              {/* QUANTITY */}

              <div className="form-group">

                <label>

                  Purchase Quantity

                  <span>
                    *
                  </span>

                </label>


                <input
                  type="number"
                  min="1"
                  step="1"
                  name="quantity"
                  value={
                    purchaseForm.quantity
                  }
                  onChange={
                    handlePurchaseChange
                  }
                  placeholder="Enter quantity"
                  required
                />

              </div>


              {/* PURCHASE PRICE */}

              <div className="form-group">

                <label>
                  Purchase Price
                </label>


                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="purchase_price"
                  value={
                    purchaseForm.purchase_price
                  }
                  onChange={
                    handlePurchaseChange
                  }
                  placeholder="Enter purchase price"
                />

              </div>


              {/* PURCHASE DATE */}

              <div className="form-group">

                <label>
                  Purchase Date
                </label>


                <input
                  type="date"
                  name="purchase_date"
                  value={
                    purchaseForm.purchase_date
                  }
                  onChange={
                    handlePurchaseChange
                  }
                />

              </div>


              {/* NOTES */}

              <div className="form-group full">

                <label>
                  Notes
                </label>


                <textarea
                  name="notes"
                  value={
                    purchaseForm.notes
                  }
                  onChange={
                    handlePurchaseChange
                  }
                  placeholder="Optional notes..."
                  rows="3"
                />

              </div>


              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={
                    closePurchaseModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >

                  {saving
                    ? "Adding..."
                    : "Add Purchase"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          ADJUSTMENT MODAL
          ================================================= */}

      {showAdjustModal &&
        selectedItem && (

          <div
            className="inventory-modal-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {

                closeAdjustModal();
              }

            }}
          >

            <div className="inventory-modal">

              <div className="modal-header">

                <div>

                  <h2>
                    Adjust Stock
                  </h2>

                  <p>
                    Manually increase or decrease stock.
                  </p>

                </div>


                <button
                  type="button"
                  className="modal-close"
                  onClick={
                    closeAdjustModal
                  }
                  disabled={saving}
                >
                  ×
                </button>

              </div>


              <form
                className="inventory-form"
                onSubmit={
                  handleAdjustSubmit
                }
              >


                {/* PRODUCT */}

                <div className="selected-product-box">

                  <strong>
                    {selectedItem.productName}
                  </strong>

                  <span>
                    Current Stock:{" "}
                    {selectedItem.currentStock}
                  </span>

                  <span>
                    Minimum Stock:{" "}
                    {selectedItem.lowStockLimit}
                  </span>

                </div>


                {/* ADJUSTMENT */}

                <div className="form-group">

                  <label>

                    Adjustment Quantity

                    <span>
                      *
                    </span>

                  </label>


                  <input
                    type="number"
                    step="1"
                    name="quantity"
                    value={
                      adjustForm.quantity
                    }
                    onChange={
                      handleAdjustChange
                    }
                    placeholder="+10 or -5"
                    required
                  />


                  <small className="form-help">

                    Use a positive number to add stock and a negative number to
                    remove stock.

                  </small>

                </div>


                {/* PREVIEW */}

                {adjustForm.quantity !== "" &&
                  Number.isInteger(
                    Number(
                      adjustForm.quantity
                    )
                  ) && (

                    <div className="adjust-preview">

                      <span>
                        New Stock
                      </span>


                      <strong>

                        {Math.max(
                          0,
                          selectedItem.currentStock +
                            Number(
                              adjustForm.quantity
                            )
                        )}

                      </strong>

                    </div>

                  )}


                {/* NOTES */}

                <div className="form-group">

                  <label>
                    Notes
                  </label>


                  <textarea
                    name="notes"
                    value={
                      adjustForm.notes
                    }
                    onChange={
                      handleAdjustChange
                    }
                    placeholder="Reason for adjustment..."
                    rows="3"
                  />

                </div>


                {/* ACTIONS */}

                <div className="modal-actions">

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={
                      closeAdjustModal
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="save-btn"
                    disabled={saving}
                  >

                    {saving
                      ? "Updating..."
                      : "Adjust Stock"}

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

    </div>
  );
};


export default Inventory;