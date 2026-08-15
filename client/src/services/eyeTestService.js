import apiRequest from "../utils/api.js";

// =====================================================
// GET ALL EYE TESTS
// GET /api/eye-tests
// =====================================================

export const getEyeTests = async () => {
  return apiRequest("/eye-tests", {
    method: "GET",
  });
};


// =====================================================
// GET SINGLE EYE TEST
// GET /api/eye-tests/:id
// =====================================================

export const getEyeTestById = async (id) => {
  if (!id) {
    throw new Error("Eye test ID is required.");
  }

  return apiRequest(`/eye-tests/${id}`, {
    method: "GET",
  });
};


// =====================================================
// GET EYE TESTS BY CUSTOMER
// GET /api/eye-tests/customer/:customerId
// =====================================================

export const getEyeTestsByCustomer = async (
  customerId
) => {
  if (!customerId) {
    throw new Error("Customer ID is required.");
  }

  return apiRequest(
    `/eye-tests/customer/${customerId}`,
    {
      method: "GET",
    }
  );
};


// =====================================================
// GET CUSTOMERS
// GET /api/eye-tests/customers
// =====================================================

export const getCustomersForEyeTest = async () => {
  return apiRequest("/eye-tests/customers", {
    method: "GET",
  });
};


// =====================================================
// GET LENS TYPES
// GET /api/eye-tests/lens-types
// =====================================================

export const getLensTypes = async () => {
  return apiRequest("/eye-tests/lens-types", {
    method: "GET",
  });
};


// =====================================================
// GET AVAILABLE FRAMES
// GET /api/eye-tests/frames
// =====================================================

export const getFramesForEyeTest = async () => {
  return apiRequest("/eye-tests/frames", {
    method: "GET",
  });
};


// =====================================================
// CREATE MANUAL FRAME
// POST /api/eye-tests/frames
// =====================================================

export const createManualFrame = async (
  frameData
) => {
  return apiRequest("/eye-tests/frames", {
    method: "POST",
    body: JSON.stringify(frameData),
  });
};


// =====================================================
// CREATE EYE TEST
// POST /api/eye-tests
// =====================================================

export const createEyeTest = async (
  eyeTestData
) => {
  return apiRequest("/eye-tests", {
    method: "POST",
    body: JSON.stringify(eyeTestData),
  });
};


// =====================================================
// UPDATE EYE TEST
// PUT /api/eye-tests/:id
// =====================================================

export const updateEyeTest = async (
  id,
  eyeTestData
) => {
  if (!id) {
    throw new Error("Eye test ID is required.");
  }

  return apiRequest(`/eye-tests/${id}`, {
    method: "PUT",
    body: JSON.stringify(eyeTestData),
  });
};


// =====================================================
// DELETE EYE TEST
// DELETE /api/eye-tests/:id
// =====================================================

export const deleteEyeTest = async (id) => {
  if (!id) {
    throw new Error("Eye test ID is required.");
  }

  return apiRequest(`/eye-tests/${id}`, {
    method: "DELETE",
  });
};