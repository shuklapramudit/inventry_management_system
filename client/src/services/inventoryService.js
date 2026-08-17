import apiRequest from "../utils/api.js";

// =====================================================
// INVENTORY SERVICE
// =====================================================


// =====================================================
// GET ALL INVENTORY
// GET /api/inventory
// =====================================================

export const getInventory = async () => {

  return apiRequest(
    "/inventory",
    {
      method: "GET",
    }
  );

};


// =====================================================
// GET LOW STOCK
// GET /api/inventory/low-stock
// =====================================================

export const getLowStock = async () => {

  return apiRequest(
    "/inventory/low-stock",
    {
      method: "GET",
    }
  );

};


// =====================================================
// GET INVENTORY BY PRODUCT
// GET /api/inventory/product/:productId
// =====================================================

export const getInventoryByProduct = async (
  productId
) => {

  return apiRequest(
    `/inventory/product/${productId}`,
    {
      method: "GET",
    }
  );

};


// =====================================================
// ADD PURCHASE
// POST /api/inventory/purchase
// =====================================================

export const addPurchase = async (
  data
) => {

  return apiRequest(
    "/inventory/purchase",
    {
      method: "POST",

      body: JSON.stringify(
        data
      ),
    }
  );

};


// =====================================================
// ADJUST STOCK
// PATCH /api/inventory/:productId/adjust
// =====================================================

export const adjustStock = async (
  productId,
  data
) => {

  return apiRequest(
    `/inventory/${productId}/adjust`,
    {
      method: "PATCH",

      body: JSON.stringify(
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