import apiRequest from "../utils/api.js";

// =====================================================
// PRODUCT SERVICE
// =====================================================
// All product related API requests are handled here.
// =====================================================


// =====================================================
// GET ALL PRODUCTS
// GET /api/products
// =====================================================

export const getProducts = async () => {
  return apiRequest("/products", {
    method: "GET",
  });
};


// =====================================================
// GET SINGLE PRODUCT
// GET /api/products/:id
// =====================================================

export const getProductById = async (id) => {
  return apiRequest(`/products/${id}`, {
    method: "GET",
  });
};


// =====================================================
// CREATE PRODUCT
// POST /api/products
// =====================================================
// FormData is used because product images are uploaded.
// =====================================================

export const createProduct = async (formData) => {
  return apiRequest("/products", {
    method: "POST",
    body: formData,
  });
};


// =====================================================
// UPDATE PRODUCT
// PUT /api/products/:id
// =====================================================
// FormData is used because new product images can be
// uploaded while editing.
// =====================================================

export const updateProduct = async (
  id,
  formData
) => {
  return apiRequest(`/products/${id}`, {
    method: "PUT",
    body: formData,
  });
};


// =====================================================
// DELETE PRODUCT
// DELETE /api/products/:id
// =====================================================

export const deleteProduct = async (id) => {
  return apiRequest(`/products/${id}`, {
    method: "DELETE",
  });
};


// =====================================================
// RESTORE PRODUCT
// PATCH /api/products/:id/restore
// =====================================================

export const restoreProduct = async (id) => {
  return apiRequest(`/products/${id}/restore`, {
    method: "PATCH",
  });
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