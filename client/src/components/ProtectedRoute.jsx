import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = () => {

  const {
    isAuthenticated,
    loading,
  } = useAuth();

  const location =
    useLocation();


  // ===================================================
  // WAIT FOR AUTH CHECK
  // ===================================================

  if (loading) {

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        Loading...
      </div>
    );

  }


  // ===================================================
  // NOT AUTHENTICATED
  // ===================================================

  if (!isAuthenticated) {

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );

  }


  // ===================================================
  // AUTHENTICATED
  // ===================================================

  return <Outlet />;
};


export default ProtectedRoute;