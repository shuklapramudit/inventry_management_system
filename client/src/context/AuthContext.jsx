import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as loginService,
  getMe,
  logout as logoutService,
} from "../services/authService.js";

const AuthContext =
  createContext(null);


// =====================================================
// AUTH PROVIDER
// =====================================================

export const AuthProvider = ({
  children,
}) => {

  const [admin, setAdmin] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  // ===================================================
  // CHECK EXISTING LOGIN
  // ===================================================

  useEffect(() => {

    const token =
      localStorage.getItem("token");

    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }

    getMe()

      .then((response) => {

        if (
          response?.success &&
          response?.admin
        ) {

          const user =
            response.admin;

          setAdmin(user);

          localStorage.setItem(
            "admin",
            JSON.stringify(user)
          );

        } else {

          logoutService();

          setAdmin(null);

        }

      })

      .catch((error) => {

        console.error(
          "Session verification failed:",
          error
        );

        logoutService();

        setAdmin(null);

      })

      .finally(() => {

        setLoading(false);

      });

  }, []);


  // ===================================================
  // LOGIN
  // ===================================================

  const login = async (
    email,
    password
  ) => {

    const response =
      await loginService(
        email,
        password
      );


    // -------------------------------------------------
    // CHECK RESPONSE
    // -------------------------------------------------

    if (!response?.success) {

      throw new Error(
        response?.message ||
          "Login failed"
      );

    }


    // -------------------------------------------------
    // GET TOKEN
    // -------------------------------------------------

    const token =
      response?.token ||
      response?.accessToken ||
      response?.data?.token ||
      response?.data?.accessToken;


    if (!token) {

      throw new Error(
        "Login successful but authorization token was not received."
      );

    }


    // -------------------------------------------------
    // GET ADMIN
    // -------------------------------------------------

    const user =
      response?.admin ||
      response?.user ||
      response?.data?.admin ||
      response?.data?.user ||
      null;


    // -------------------------------------------------
    // SAVE TOKEN
    // -------------------------------------------------

    localStorage.setItem(
      "token",
      token
    );


    // Compatibility keys

    localStorage.setItem(
      "authToken",
      token
    );


    localStorage.setItem(
      "accessToken",
      token
    );


    // -------------------------------------------------
    // SAVE ADMIN
    // -------------------------------------------------

    if (user) {

      localStorage.setItem(
        "admin",
        JSON.stringify(user)
      );


      // Compatibility with older code

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

    }


    // -------------------------------------------------
    // UPDATE CONTEXT
    // -------------------------------------------------

    setAdmin(user);


    return response;
  };


  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = () => {

    logoutService();


    // Remove compatibility keys

    localStorage.removeItem(
      "authToken"
    );

    localStorage.removeItem(
      "accessToken"
    );

    localStorage.removeItem(
      "user"
    );


    setAdmin(null);

  };


  // ===================================================
  // AUTHENTICATION STATUS
  // ===================================================

  const isAuthenticated =
    Boolean(
      localStorage.getItem(
        "token"
      )
    );


  // ===================================================
  // CONTEXT VALUE
  // ===================================================

  const value = {

    admin,

    loading,

    isAuthenticated,

    login,

    logout,

  };


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};


// =====================================================
// USE AUTH
// =====================================================

export const useAuth = () => {

  const context =
    useContext(AuthContext);


  if (!context) {

    throw new Error(
      "useAuth must be used inside AuthProvider"
    );

  }


  return context;
};


export default AuthContext;