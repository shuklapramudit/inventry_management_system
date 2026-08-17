import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getInventory,
  getLowStock,
  addPurchase,
  adjustStock,
} from "../services/inventoryService.js";

import "./Inventory.css";


// =====================================================
// BACKEND BASE URL
// =====================================================

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  "https://inventry-management-system-1-obf0.onrender.com/api";


// =====================================================
// GET BACKEND URL
// =====================================================

const getBackendUrl = () => {

  const apiUrl = String(
    RAW_API_URL || ""
  )
    .trim()
    .replace(/\/+$/, "");

  return apiUrl.replace(
    /\/api$/i,
    ""
  );
};


// =====================================================
// PRODUCT IMAGE URL
// =====================================================

const getProductImageUrl = (
  image
) => {

  if (!image) {
    return "";
  }

  let imagePath = String(
    image
  ).trim();

  if (!imagePath) {
    return "";
  }


  // ---------------------------------------------------
  // Already complete URL
  // ---------------------------------------------------

  if (
    imagePath.startsWith(
      "http://"
    ) ||
    imagePath.startsWith(
      "https://"
    )
  ) {

    return imagePath;
  }


  // ---------------------------------------------------
  // Convert Windows path to URL path
  // ---------------------------------------------------

  imagePath =
    imagePath.replace(
      /\\/g,
      "/"
    );


  // ---------------------------------------------------
  // Remove accidental frontend/API prefixes
  // ---------------------------------------------------

  imagePath =
    imagePath.replace(
      /^https?:\/\/[^/]+/i,
      ""
    );


  imagePath =
    imagePath.replace(
      /^\/+/,
      ""
    );


  imagePath =
    imagePath.replace(
      /^api\/+/i,
      ""
    );


  // ---------------------------------------------------
  // Backend URL
  // ---------------------------------------------------

  const backendUrl =
    getBackendUrl();


  return `${backendUrl}/${imagePath}`;
};


// =====================================================
// GET PRODUCT IMAGE FROM OBJECT
// =====================================================

const getProductImage = (
  item
) => {

  return (
    item?.image ||
    item?.Image ||
    item?.productImage ||
    item?.ProductImage ||
    item?.imageUrl ||
    item?.ImageURL ||
    item?.product_image ||
    item?.Product_Image ||
    item?.image_path ||
    item?.ImagePath ||
    ""
  );
};


// =====================================================
// NORMALIZE NUMBER
// =====================================================

const toNumber = (
  value
) => {

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};


// =====================================================
// GET PRODUCT NAME
// =====================================================

const getProductName = (
  item
) => {

  return (
    item?.productName ||
    item?.ProductName ||
    item?.name ||
    item?.Name ||
    item?.product_name ||
    "Unknown Product"
  );
};


// =====================================================
// GET PRODUCT ID
// =====================================================

const getProductId = (
  item
) => {

  return (
    item?.productId ??
    item?.ProductID ??
    item?.ProductId ??
    item?.id ??
    item?.ID ??
    ""
  );
};


// =====================================================
// GET PRODUCT TYPE
// =====================================================

const getProductType = (
  item
) => {

  return (
    item?.productType ||
    item?.ProductType ||
    item?.type ||
    item?.Type ||
    item?.category ||
    item?.Category ||
    "-"
  );
};


// =====================================================
// GET SHOP
// =====================================================

const getShop = (
  item
) => {

  return (
    item?.shopName ||
    item?.ShopName ||
    item?.shop ||
    item?.Shop ||
    item?.storeName ||
    item?.StoreName ||
    "-"
  );
};


// =====================================================
// GET PURCHASED
// =====================================================

const getPurchased = (
  item
) => {

  return toNumber(
    item?.purchased ??
    item?.Purchased ??
    item?.totalPurchased ??
    item?.TotalPurchased ??
    item?.purchaseQuantity ??
    item?.PurchaseQuantity
  );
};


// =====================================================
// GET SOLD
// =====================================================

const getSold = (
  item
) => {

  return toNumber(
    item?.sold ??
    item?.Sold ??
    item?.totalSold ??
    item?.TotalSold ??
    item?.soldQuantity ??
    item?.SoldQuantity
  );
};


// =====================================================
// GET CURRENT STOCK
// =====================================================

const getCurrentStock = (
  item
) => {

  const directStock =
    item?.currentStock ??
    item?.CurrentStock ??
    item?.stock ??
    item?.Stock ??
    item?.quantity ??
    item?.Quantity;

  if (
    directStock !==
      undefined &&
    directStock !== null
  ) {

    return toNumber(
      directStock
    );
  }


  return (
    getPurchased(item) -
    getSold(item)
  );
};


// =====================================================
// GET LOW STOCK LIMIT
// =====================================================

const getLowStockLimit = (
  item
) => {

  return toNumber(
    item?.lowStockLimit ??
    item?.LowStockLimit ??
    item?.minimumStock ??
    item?.MinimumStock ??
    item?.reorderLevel ??
    item?.ReorderLevel ??
    5
  );
};


// =====================================================
// STOCK STATUS
// =====================================================

const getStockStatus = (
  item
) => {

  const stock =
    getCurrentStock(item);

  const lowStockLimit =
    getLowStockLimit(item);


  if (stock <= 0) {
    return "out";
  }


  if (
    stock <=
    lowStockLimit
  ) {

    return "low";
  }


  return "available";
};


// =====================================================
// COMPONENT
// =====================================================

const Inventory = () => {

  // ===================================================
  // STATE
  // ===================================================

  const [
    inventory,
    setInventory,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");


  // ===================================================
  // PURCHASE MODAL
  // ===================================================

  const [
    showPurchaseModal,
    setShowPurchaseModal,
  ] = useState(false);


  const [
    purchaseForm,
    setPurchaseForm,
  ] = useState({
    productId: "",
    quantity: "",
    shop: "",
    purchasePrice: "",
    notes: "",
  });


  // ===================================================
  // ADJUST MODAL
  // ===================================================

  const [
    showAdjustModal,
    setShowAdjustModal,
  ] = useState(false);


  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);


  const [
    adjustForm,
    setAdjustForm,
  ] = useState({
    quantity: "",
    type: "add",
    reason: "",
  });


  // ===================================================
  // LOAD INVENTORY
  // ===================================================

  const loadInventory = useCallback(
    async (
      showLoader = true
    ) => {

      try {

        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }


        setError("");


        const response =
          await getInventory();


        console.log(
          "Inventory API:",
          response
        );


        const records =
          Array.isArray(
            response?.inventory
          )
            ? response.inventory
            : Array.isArray(
                response?.data
              )
              ? response.data
              : Array.isArray(
                  response
                )
                ? response
                : [];


        console.log(
          "Inventory Records:",
          records
        );


        setInventory(
          records
        );

      } catch (err) {

        console.error(
          "Inventory Fetch Error:",
          err
        );


        setError(
          err?.message ||
          "Failed to load inventory"
        );

        setInventory([]);

      } finally {

        setLoading(false);
        setRefreshing(false);
      }

    },
    []
  );


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    loadInventory();

  }, [
    loadInventory,
  ]);


  // ===================================================
  // FILTERED INVENTORY
  // ===================================================

  const filteredInventory =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();


      return inventory.filter(
        (item) => {

          const productName =
            getProductName(
              item
            )
              .toLowerCase();

          const productType =
            String(
              getProductType(
                item
              )
            )
              .toLowerCase();

          const shop =
            String(
              getShop(item)
            )
              .toLowerCase();

          const productId =
            String(
              getProductId(
                item
              )
            )
              .toLowerCase();


          const matchesSearch =
            !searchText ||
            productName.includes(
              searchText
            ) ||
            productType.includes(
              searchText
            ) ||
            shop.includes(
              searchText
            ) ||
            productId.includes(
              searchText
            );


          const status =
            getStockStatus(
              item
            );


          const matchesStatus =
            statusFilter ===
              "all" ||
            (
              statusFilter ===
                "low" &&
              status ===
                "low"
            ) ||
            (
              statusFilter ===
                "out" &&
              status ===
                "out"
            ) ||
            (
              statusFilter ===
                "available" &&
              status ===
                "available"
            );


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

      let currentStock = 0;
      let purchased = 0;
      let sold = 0;
      let lowStock = 0;
      let outOfStock = 0;


      inventory.forEach(
        (item) => {

          const stock =
            getCurrentStock(
              item
            );

          currentStock +=
            stock;

          purchased +=
            getPurchased(
              item
            );

          sold +=
            getSold(
              item
            );


          const status =
            getStockStatus(
              item
            );


          if (
            status ===
            "low"
          ) {

            lowStock++;

          }


          if (
            status ===
            "out"
          ) {

            outOfStock++;
          }

        }
      );


      return {
        products:
          inventory.length,

        currentStock,

        purchased,

        sold,

        lowStock,

        outOfStock,
      };

    }, [
      inventory,
    ]);


  // ===================================================
  // CLEAR MESSAGES
  // ===================================================

  const clearMessages =
    () => {

      setError("");
      setSuccess("");

    };


  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    async () => {

      clearMessages();

      await loadInventory(
        false
      );

    };


  // ===================================================
  // PURCHASE FORM CHANGE
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
  // ADJUST FORM CHANGE
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
  // OPEN PURCHASE MODAL
  // ===================================================

  const openPurchaseModal =
    () => {

      clearMessages();

      setPurchaseForm({
        productId:
          inventory.length
            ? String(
                getProductId(
                  inventory[0]
                )
              )
            : "",

        quantity: "",

        shop: "",

        purchasePrice: "",

        notes: "",
      });


      setShowPurchaseModal(
        true
      );

    };


  // ===================================================
  // CLOSE PURCHASE MODAL
  // ===================================================

  const closePurchaseModal =
    () => {

      if (saving) {
        return;
      }


      setShowPurchaseModal(
        false
      );

    };


  // ===================================================
  // OPEN ADJUST MODAL
  // ===================================================

  const openAdjustModal =
    (item) => {

      clearMessages();


      setSelectedProduct(
        item
      );


      setAdjustForm({
        quantity: "",

        type: "add",

        reason: "",
      });


      setShowAdjustModal(
        true
      );

    };


  // ===================================================
  // CLOSE ADJUST MODAL
  // ===================================================

  const closeAdjustModal =
    () => {

      if (saving) {
        return;
      }


      setShowAdjustModal(
        false
      );

      setSelectedProduct(
        null
      );

    };


  // ===================================================
  // ADD PURCHASE
  // ===================================================

  const handlePurchaseSubmit =
    async (event) => {

      event.preventDefault();


      clearMessages();


      const productId =
        purchaseForm.productId;

      const quantity =
        Number(
          purchaseForm.quantity
        );


      if (!productId) {

        setError(
          "Please select a product."
        );

        return;
      }


      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {

        setError(
          "Please enter a valid purchase quantity."
        );

        return;
      }


      try {

        setSaving(true);


        const payload = {
          productId:
            Number(
              productId
            ),

          quantity,

          shop:
            purchaseForm.shop
              .trim(),

          purchasePrice:
            purchaseForm.purchasePrice
              ? Number(
                  purchaseForm.purchasePrice
                )
              : 0,

          notes:
            purchaseForm.notes
              .trim(),
        };


        console.log(
          "Purchase Payload:",
          payload
        );


        await addPurchase(
          payload
        );


        setSuccess(
          "Purchase added successfully."
        );


        setShowPurchaseModal(
          false
        );


        setPurchaseForm({
          productId: "",

          quantity: "",

          shop: "",

          purchasePrice: "",

          notes: "",
        });


        await loadInventory(
          false
        );

      } catch (err) {

        console.error(
          "Add Purchase Error:",
          err
        );


        setError(
          err?.message ||
          "Failed to add purchase."
        );

      } finally {

        setSaving(false);
      }

    };


  // ===================================================
  // ADJUST STOCK
  // ===================================================

  const handleAdjustSubmit =
    async (event) => {

      event.preventDefault();


      clearMessages();


      if (!selectedProduct) {

        setError(
          "No product selected."
        );

        return;
      }


      const productId =
        getProductId(
          selectedProduct
        );


      const quantity =
        Number(
          adjustForm.quantity
        );


      if (!productId) {

        setError(
          "Product ID is missing."
        );

        return;
      }


      if (
        !Number.isFinite(
          quantity
        ) ||
        quantity <= 0
      ) {

        setError(
          "Please enter a valid quantity."
        );

        return;
      }


      try {

        setSaving(true);


        const payload = {

          quantity,

          type:
            adjustForm.type,

          reason:
            adjustForm.reason
              .trim(),

        };


        console.log(
          "Adjust Stock Payload:",
          payload
        );


        await adjustStock(
          productId,
          payload
        );


        setSuccess(
          "Stock adjusted successfully."
        );


        setShowAdjustModal(
          false
        );


        setSelectedProduct(
          null
        );


        await loadInventory(
          false
        );

      } catch (err) {

        console.error(
          "Adjust Stock Error:",
          err
        );


        setError(
          err?.message ||
          "Failed to adjust stock."
        );

      } finally {

        setSaving(false);
      }

    };


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {

    return (
      <div className="inventory-page">

        <div className="inventory-loading">

          <div className="inventory-spinner">
            ↻
          </div>

          <p>
            Loading inventory...
          </p>

        </div>

      </div>
    );

  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="inventory-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="inventory-page-header">

        <div>

          <h1>
            Inventory
          </h1>

          <p>
            Manage and monitor your product stock.
          </p>

        </div>


        <div className="inventory-header-actions">

          <button
            type="button"
            className="inventory-refresh-btn"
            onClick={
              handleRefresh
            }
            disabled={
              refreshing
            }
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
            className="inventory-primary-btn"
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
          MESSAGES
      ================================================= */}

      {error && (

        <div className="inventory-alert inventory-alert-error">

          <span>
            !
          </span>

          <div>
            {error}
          </div>

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

        <div className="inventory-alert inventory-alert-success">

          <span>
            ✓
          </span>

          <div>
            {success}
          </div>

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
          SUMMARY CARDS
      ================================================= */}

      <div className="inventory-summary-grid">


        <div className="inventory-summary-card">

          <div className="inventory-summary-icon">
            ▤
          </div>

          <div>

            <span>
              Products
            </span>

            <strong>
              {summary.products}
            </strong>

          </div>

        </div>


        <div className="inventory-summary-card">

          <div className="inventory-summary-icon">
            #
          </div>

          <div>

            <span>
              Current Stock
            </span>

            <strong>
              {summary.currentStock}
            </strong>

          </div>

        </div>


        <div className="inventory-summary-card">

          <div className="inventory-summary-icon">
            +
          </div>

          <div>

            <span>
              Purchased
            </span>

            <strong>
              {summary.purchased}
            </strong>

          </div>

        </div>


        <div className="inventory-summary-card">

          <div className="inventory-summary-icon">
            −
          </div>

          <div>

            <span>
              Sold
            </span>

            <strong>
              {summary.sold}
            </strong>

          </div>

        </div>


        <div className="inventory-summary-card inventory-summary-warning">

          <div className="inventory-summary-icon">
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


        <div className="inventory-summary-card inventory-summary-danger">

          <div className="inventory-summary-icon">
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
          INVENTORY CARD
      ================================================= */}

      <div className="inventory-card">


        <div className="inventory-card-header">

          <div>

            <h2>
              Inventory Items
            </h2>

            <p>
              Current inventory records from your database.
            </p>

          </div>


          <div className="inventory-record-count">

            {filteredInventory.length}
            {" "}
            Records

          </div>

        </div>


        {/* =================================================
            SEARCH / FILTER
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

          </div>


          <select
            value={
              statusFilter
            }
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="inventory-filter"
          >

            <option value="all">
              All Stock
            </option>

            <option value="available">
              Available
            </option>

            <option value="low">
              Low Stock
            </option>

            <option value="out">
              Out of Stock
            </option>

          </select>


          <div className="inventory-showing">

            Showing{" "}

            {filteredInventory.length}

            {" "}of{" "}

            {inventory.length}

          </div>

        </div>


        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="inventory-table-wrapper">

          <table className="inventory-table">

            <thead>

              <tr>

                <th>
                  PRODUCT
                </th>

                <th>
                  TYPE
                </th>

                <th>
                  SHOP
                </th>

                <th>
                  PURCHASED
                </th>

                <th>
                  SOLD
                </th>

                <th>
                  STOCK
                </th>

                <th>
                  STATUS
                </th>

                <th>
                  ACTION
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredInventory.length ===
                0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="inventory-empty-cell"
                  >

                    <div className="inventory-empty">

                      <div className="inventory-empty-icon">
                        ▤
                      </div>

                      <h3>
                        No inventory records
                      </h3>

                      <p>
                        No inventory items match your current search or filter.
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                filteredInventory.map(
                  (
                    item,
                    index
                  ) => {

                    const id =
                      getProductId(
                        item
                      );

                    const name =
                      getProductName(
                        item
                      );

                    const type =
                      getProductType(
                        item
                      );

                    const shop =
                      getShop(
                        item
                      );

                    const purchased =
                      getPurchased(
                        item
                      );

                    const sold =
                      getSold(
                        item
                      );

                    const stock =
                      getCurrentStock(
                        item
                      );

                    const status =
                      getStockStatus(
                        item
                      );

                    const image =
                      getProductImage(
                        item
                      );

                    const imageUrl =
                      getProductImageUrl(
                        image
                      );


                    return (
                      <tr
                        key={
                          `${id}-${index}`
                        }
                      >

                        <td>

                          <div className="inventory-product-cell">

                            <div className="inventory-product-image">

                              {imageUrl ? (

                                <img
                                  src={
                                    imageUrl
                                  }
                                  alt={
                                    name
                                  }
                                  onError={(
                                    event
                                  ) => {

                                    console.error(
                                      "Inventory product image failed:",
                                      event
                                        .currentTarget
                                        .src
                                    );

                                    event
                                      .currentTarget
                                      .style
                                      .display =
                                      "none";

                                  }}
                                />

                              ) : (

                                <div className="inventory-image-placeholder">
                                  ▣
                                </div>

                              )}

                            </div>


                            <div>

                              <strong>
                                {name}
                              </strong>

                              <small>
                                ID: {id || "-"}
                              </small>

                            </div>

                          </div>

                        </td>


                        <td>
                          {type}
                        </td>


                        <td>

                          <span className="inventory-shop-badge">
                            {shop}
                          </span>

                        </td>


                        <td>
                          {purchased}
                        </td>


                        <td>
                          {sold}
                        </td>


                        <td>

                          <strong
                            className={
                              stock <= 0
                                ? "stock-danger"
                                : stock <=
                                    getLowStockLimit(
                                      item
                                    )
                                  ? "stock-warning"
                                  : ""
                            }
                          >
                            {stock}
                          </strong>

                        </td>


                        <td>

                          <span
                            className={`inventory-status inventory-status-${status}`}
                          >

                            {status ===
                              "out"
                              ? "Out of Stock"
                              : status ===
                                  "low"
                                ? "Low Stock"
                                : "Available"}

                          </span>

                        </td>


                        <td>

                          <button
                            type="button"
                            className="inventory-adjust-btn"
                            onClick={() =>
                              openAdjustModal(
                                item
                              )
                            }
                          >
                            Adjust
                          </button>

                        </td>

                      </tr>
                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            MOBILE CARDS
        ================================================= */}

        <div className="inventory-mobile-list">

          {filteredInventory.length ===
          0 ? (

            <div className="inventory-empty">

              <div className="inventory-empty-icon">
                ▤
              </div>

              <h3>
                No inventory records
              </h3>

              <p>
                No inventory items match your current search or filter.
              </p>

            </div>

          ) : (

            filteredInventory.map(
              (
                item,
                index
              ) => {

                const id =
                  getProductId(
                    item
                  );

                const name =
                  getProductName(
                    item
                  );

                const type =
                  getProductType(
                    item
                  );

                const shop =
                  getShop(
                    item
                  );

                const purchased =
                  getPurchased(
                    item
                  );

                const sold =
                  getSold(
                    item
                  );

                const stock =
                  getCurrentStock(
                    item
                  );

                const status =
                  getStockStatus(
                    item
                  );

                const image =
                  getProductImage(
                    item
                  );

                const imageUrl =
                  getProductImageUrl(
                    image
                  );


                return (
                  <div
                    className="inventory-mobile-item"
                    key={
                      `${id}-mobile-${index}`
                    }
                  >

                    <div className="inventory-mobile-product">

                      <div className="inventory-product-image">

                        {imageUrl ? (

                          <img
                            src={
                              imageUrl
                            }
                            alt={
                              name
                            }
                            onError={(
                              event
                            ) => {

                              console.error(
                                "Inventory product image failed:",
                                event
                                  .currentTarget
                                  .src
                              );

                              event
                                .currentTarget
                                .style
                                .display =
                                "none";

                            }}
                          />

                        ) : (

                          <div className="inventory-image-placeholder">
                            ▣
                          </div>

                        )}

                      </div>


                      <div>

                        <strong>
                          {name}
                        </strong>

                        <small>
                          ID: {id || "-"}
                        </small>

                      </div>

                    </div>


                    <div className="inventory-mobile-details">

                      <div>
                        <span>
                          Type
                        </span>

                        <strong>
                          {type}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Shop
                        </span>

                        <strong>
                          {shop}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Purchased
                        </span>

                        <strong>
                          {purchased}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Sold
                        </span>

                        <strong>
                          {sold}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Current Stock
                        </span>

                        <strong>
                          {stock}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Status
                        </span>

                        <span
                          className={`inventory-status inventory-status-${status}`}
                        >
                          {status ===
                            "out"
                            ? "Out of Stock"
                            : status ===
                                "low"
                              ? "Low Stock"
                              : "Available"}
                        </span>
                      </div>

                    </div>


                    <button
                      type="button"
                      className="inventory-adjust-btn inventory-mobile-adjust"
                      onClick={() =>
                        openAdjustModal(
                          item
                        )
                      }
                    >
                      Adjust Stock
                    </button>

                  </div>
                );

              }
            )

          )}

        </div>

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

            <div className="inventory-modal-header">

              <div>

                <h2>
                  Add Purchase
                </h2>

                <p>
                  Add new stock to inventory.
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closePurchaseModal
                }
                disabled={
                  saving
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handlePurchaseSubmit
              }
            >

              <div className="inventory-form-group">

                <label>
                  Product
                </label>

                <select
                  name="productId"
                  value={
                    purchaseForm.productId
                  }
                  onChange={
                    handlePurchaseChange
                  }
                  required
                >

                  <option value="">
                    Select Product
                  </option>

                  {inventory.map(
                    (
                      item,
                      index
                    ) => {

                      const id =
                        getProductId(
                          item
                        );

                      return (
                        <option
                          key={
                            `${id}-${index}`
                          }
                          value={
                            id
                          }
                        >
                          {getProductName(
                            item
                          )}
                        </option>
                      );

                    }
                  )}

                </select>

              </div>


              <div className="inventory-form-row">

                <div className="inventory-form-group">

                  <label>
                    Quantity
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    min="1"
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


                <div className="inventory-form-group">

                  <label>
                    Purchase Price
                  </label>

                  <input
                    type="number"
                    name="purchasePrice"
                    min="0"
                    step="0.01"
                    value={
                      purchaseForm.purchasePrice
                    }
                    onChange={
                      handlePurchaseChange
                    }
                    placeholder="Optional"
                  />

                </div>

              </div>


              <div className="inventory-form-group">

                <label>
                  Shop
                </label>

                <input
                  type="text"
                  name="shop"
                  value={
                    purchaseForm.shop
                  }
                  onChange={
                    handlePurchaseChange
                  }
                  placeholder="Enter shop name"
                />

              </div>


              <div className="inventory-form-group">

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
                  placeholder="Optional notes"
                  rows="3"
                />

              </div>


              <div className="inventory-modal-actions">

                <button
                  type="button"
                  className="inventory-cancel-btn"
                  onClick={
                    closePurchaseModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="inventory-primary-btn"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Add Purchase"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          ADJUST STOCK MODAL
      ================================================= */}

      {showAdjustModal &&
        selectedProduct && (

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

            <div className="inventory-modal-header">

              <div>

                <h2>
                  Adjust Stock
                </h2>

                <p>
                  {getProductName(
                    selectedProduct
                  )}
                </p>

              </div>


              <button
                type="button"
                onClick={
                  closeAdjustModal
                }
                disabled={
                  saving
                }
              >
                ×
              </button>

            </div>


            <div className="inventory-current-stock">

              <span>
                Current Stock
              </span>

              <strong>
                {
                  getCurrentStock(
                    selectedProduct
                  )
                }
              </strong>

            </div>


            <form
              onSubmit={
                handleAdjustSubmit
              }
            >

              <div className="inventory-form-row">

                <div className="inventory-form-group">

                  <label>
                    Adjustment Type
                  </label>

                  <select
                    name="type"
                    value={
                      adjustForm.type
                    }
                    onChange={
                      handleAdjustChange
                    }
                  >

                    <option value="add">
                      Add Stock
                    </option>

                    <option value="remove">
                      Remove Stock
                    </option>

                  </select>

                </div>


                <div className="inventory-form-group">

                  <label>
                    Quantity
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={
                      adjustForm.quantity
                    }
                    onChange={
                      handleAdjustChange
                    }
                    placeholder="Enter quantity"
                    required
                  />

                </div>

              </div>


              <div className="inventory-form-group">

                <label>
                  Reason
                </label>

                <textarea
                  name="reason"
                  value={
                    adjustForm.reason
                  }
                  onChange={
                    handleAdjustChange
                  }
                  placeholder="Enter adjustment reason"
                  rows="3"
                />

              </div>


              <div className="inventory-modal-actions">

                <button
                  type="button"
                  className="inventory-cancel-btn"
                  onClick={
                    closeAdjustModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="inventory-primary-btn"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
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