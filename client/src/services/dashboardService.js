import { getApiBaseUrl } from "../utils/api.js";

// =====================================================
// API
// =====================================================

const API = `${getApiBaseUrl()}/dashboard`;


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
// COMMON FETCH OPTIONS
// =====================================================

const getHeaders = () => {
  const token = getToken();

  return {
    "Content-Type": "application/json",

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};


// =====================================================
// GET DASHBOARD
// GET /api/dashboard
// =====================================================

export const getDashboard = async () => {
  const response = await fetch(API, {
    method: "GET",
    headers: getHeaders(),
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Failed to load dashboard data (${response.status})`
    );
  }

  return data;
};


// =====================================================
// GET MONTHLY SALES
// GET /api/dashboard/monthly-sales
// =====================================================

export const getMonthlySales = async () => {
  const response = await fetch(
    `${API}/monthly-sales`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Failed to fetch monthly sales (${response.status})`
    );
  }

  return data;
};


// =====================================================
// GET YEARLY SALES
// GET /api/dashboard/yearly-sales
// =====================================================

export const getYearlySales = async () => {
  const response = await fetch(
    `${API}/yearly-sales`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Failed to fetch yearly sales (${response.status})`
    );
  }

  return data;
};


// =====================================================
// GET LOW STOCK
// GET /api/dashboard/low-stock
// =====================================================

export const getLowStock = async () => {
  const response = await fetch(
    `${API}/low-stock`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Failed to fetch low stock products (${response.status})`
    );
  }

  return data;
};