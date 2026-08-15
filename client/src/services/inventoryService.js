// =====================================================
// INVENTORY SERVICE
// =====================================================

// =====================================================
// API CONFIGURATION
// =====================================================

const RAW_API_URL =
  import.meta.env.VITE_API_URL ||
  "https://inventry-management-system-1-obf0.onrender.com/api";


// =====================================================
// NORMALIZE API BASE URL
// =====================================================

const API_BASE_URL = (() => {

  const baseUrl =
    RAW_API_URL
      .trim()
      .replace(/\/+$/, "");

  if (
    baseUrl
      .toLowerCase()
      .endsWith("/api")
  ) {
    return baseUrl;
  }

  return `${baseUrl}/api`;

})();


// =====================================================
// INVENTORY API
// =====================================================

const API =
  `${API_BASE_URL}/inventory`;


// =====================================================
// GET AUTH TOKEN
// =====================================================

const getToken = () => {

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );

};


// =====================================================
// COMMON HEADERS
// =====================================================

const getHeaders = () => {

  const token =
    getToken();

  return {

    "Content-Type":
      "application/json",

    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),

  };

};


// =====================================================
// COMMON API REQUEST
// =====================================================

const request = async (
  endpoint,
  options = {}
) => {

  const cleanEndpoint =
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;


  const url =
    `${API}${cleanEndpoint}`;


  console.log(
    "Inventory API Request:",
    url
  );


  let response;

  try {

    response =
      await fetch(
        url,
        {
          ...options,
          headers: {
            ...getHeaders(),
            ...(options.headers || {}),
          },
        }
      );

  } catch (error) {

    console.error(
      "Inventory Network Error:",
      error
    );

    throw new Error(
      "Unable to connect to inventory server."
    );

  }


  let data = {};

  try {

    data =
      await response.json();

  } catch {

    data = {};

  }


  if (!response.ok) {

    const error =
      new Error(
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`
      );

    error.status =
      response.status;

    error.data =
      data;

    throw error;

  }


  return data;

};


// =====================================================
// GET ALL INVENTORY
// GET /api/inventory
// =====================================================

export const getInventory =
  async () => {

    return request(
      "",
      {
        method: "GET",
      }
    );

  };


// =====================================================
// GET LOW STOCK
// GET /api/inventory/low-stock
// =====================================================

export const getLowStock =
  async () => {

    return request(
      "/low-stock",
      {
        method: "GET",
      }
    );

  };


// =====================================================
// GET INVENTORY BY PRODUCT
// GET /api/inventory/product/:productId
// =====================================================

export const getInventoryByProduct =
  async (
    productId
  ) => {

    return request(
      `/product/${productId}`,
      {
        method: "GET",
      }
    );

  };


// =====================================================
// ADD PURCHASE
// POST /api/inventory/purchase
// =====================================================

export const addPurchase =
  async (
    data
  ) => {

    return request(
      "/purchase",
      {
        method: "POST",

        body:
          JSON.stringify(
            data
          ),
      }
    );

  };


// =====================================================
// ADJUST STOCK
// PATCH /api/inventory/:productId/adjust
// =====================================================

export const adjustStock =
  async (
    productId,
    data
  ) => {

    return request(
      `/${productId}/adjust`,
      {
        method: "PATCH",

        body:
          JSON.stringify(
            data
          ),
      }
    );

  };


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {

  getInventory,

  getLowStock,

  getInventoryByProduct,

  addPurchase,

  adjustStock,

};