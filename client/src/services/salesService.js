import apiRequest from "../utils/api.js";

// =====================================================
// SALES SERVICE
// =====================================================


// =====================================================
// GET ALL SALES
// GET /api/sales
// =====================================================

export const getSales = async () => {
  return apiRequest("/sales", {
    method: "GET",
  });
};


// =====================================================
// GET SALES CUSTOMERS
// GET /api/sales/customers
// =====================================================

export const getSalesCustomers = async () => {
  return apiRequest("/sales/customers", {
    method: "GET",
  });
};


// =====================================================
// GET CUSTOMER SALES INFORMATION
// GET /api/sales/customer/:customerId
// =====================================================

export const getCustomerSalesInfo = async (
  customerId
) => {
  return apiRequest(
    `/sales/customer/${customerId}`,
    {
      method: "GET",
    }
  );
};


// =====================================================
// CREATE SALE
// POST /api/sales
// =====================================================

export const createSale = async (saleData) => {
  return apiRequest("/sales", {
    method: "POST",
    body: JSON.stringify(saleData),
    headers: {
      "Content-Type": "application/json",
    },
  });
};


// =====================================================
// GET SALE BY ID
// GET /api/sales/:id
// =====================================================

export const getSaleById = async (id) => {
  return apiRequest(`/sales/${id}`, {
    method: "GET",
  });
};


// =====================================================
// UPDATE PAYMENT
// PATCH /api/sales/:id/payment
// =====================================================

export const updatePaymentStatus = async (
  id,
  paymentData
) => {
  return apiRequest(
    `/sales/${id}/payment`,
    {
      method: "PATCH",
      body: JSON.stringify(paymentData),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  getSales,
  getSalesCustomers,
  getCustomerSalesInfo,
  createSale,
  getSaleById,
  updatePaymentStatus,
};