import apiRequest from "../utils/api.js";


// =====================================================
// LOGIN
// POST /api/auth/login
// =====================================================

export const login = async (
  email,
  password
) => {

  return apiRequest(
    "/auth/login",
    {
      method: "POST",

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

};


// =====================================================
// GET CURRENT ADMIN
// GET /api/auth/me
// =====================================================

export const getMe = async () => {

  return apiRequest(
    "/auth/me",
    {
      method: "GET",
    }
  );

};


// =====================================================
// LOGOUT
// =====================================================

export const logout = () => {

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "admin"
  );

  localStorage.removeItem(
    "authToken"
  );

  localStorage.removeItem(
    "accessToken"
  );

  localStorage.removeItem(
    "user"
  );

};


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
  login,
  getMe,
  logout,
};