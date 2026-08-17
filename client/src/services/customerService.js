import apiRequest from "../utils/api.js";

// =====================================================
// CUSTOMER SERVICE
// =====================================================


// =====================================================
// GET ALL CUSTOMERS
// GET /api/customers
// =====================================================

export const getCustomers = async () => {
  return apiRequest("/customers", {
    method: "GET",
  });
};


// =====================================================
// GET CUSTOMER BY ID
// GET /api/customers/:id
// =====================================================

export const getCustomerById = async (id) => {
  return apiRequest(`/customers/${id}`, {
    method: "GET",
  });
};


// =====================================================
// CREATE CUSTOMER
// POST /api/customers
// =====================================================

export const createCustomer = async (customerData) => {
  return apiRequest("/customers", {
    method: "POST",
    body: JSON.stringify(customerData),
    headers: {
      "Content-Type": "application/json",
    },
  });
};


// =====================================================
// UPDATE CUSTOMER
// PUT /api/customers/:id
// =====================================================

export const updateCustomer = async (
  id,
  customerData
) => {
  return apiRequest(`/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(customerData),
    headers: {
      "Content-Type": "application/json",
    },
  });
};


// =====================================================
// DELETE CUSTOMER
// DELETE /api/customers/:id
// =====================================================

export const deleteCustomer = async (id) => {
  return apiRequest(`/customers/${id}`, {
    method: "DELETE",
  });
};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};