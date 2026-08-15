import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

// =====================================================
// PAGES
// =====================================================

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Customers from "./pages/Customers.jsx";
import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import EyeTesting from "./pages/EyeTesting.jsx";
import Sales from "./pages/Sales.jsx";

// =====================================================
// COMPONENTS
// =====================================================

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import MainLayout from "./components/MainLayout.jsx";

// =====================================================
// STYLES
// =====================================================

import "./App.css";

// =====================================================
// APP
// =====================================================

const App = () => {
  return (
    <Routes>

      {/* =================================================
          PUBLIC ROUTE
          ================================================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      {/* =================================================
          PROTECTED ROUTES
          ================================================= */}

      <Route element={<ProtectedRoute />}>

        {/* =================================================
            MAIN LAYOUT
            SIDEBAR + HEADER + PAGE CONTENT
            ================================================= */}

        <Route element={<MainLayout />}>

          {/* DASHBOARD */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* CUSTOMERS */}

          <Route
            path="/customers"
            element={<Customers />}
          />

          {/* PRODUCTS */}

          <Route
            path="/products"
            element={<Products />}
          />

          {/* INVENTORY */}

          <Route
            path="/inventory"
            element={<Inventory />}
          />

          {/* EYE TESTING */}

          <Route
            path="/eye-testing"
            element={<EyeTesting />}
          />

          {/* SALES */}

          <Route
            path="/sales"
            element={<Sales />}
          />

        </Route>

      </Route>

      {/* =================================================
          ROOT
          ================================================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      {/* =================================================
          404
          ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
};

export default App;