import React, {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  getDashboard,
} from "../services/dashboardService.js";

import "./Dashboard.css";


// =====================================================
// DASHBOARD
// =====================================================

const Dashboard = () => {

  // ===================================================
  // STATS
  // ===================================================

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    inventoryItems: 0,
    totalSales: 0,
  });


  // ===================================================
  // STATES
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadDashboard = async () => {

    try {

      setLoading(true);

      setError("");


      // ===============================================
      // CALL DASHBOARD API
      // ===============================================

      const response =
        await getDashboard();


      console.log(
        "Dashboard API Response:",
        response
      );


      // ===============================================
      // GET DASHBOARD OBJECT
      // ===============================================

      const dashboard =
        response?.dashboard ||
        response?.data?.dashboard ||
        response?.data ||
        response ||
        {};


      console.log(
        "Dashboard Data:",
        dashboard
      );


      // ===============================================
      // MAP BACKEND DATA
      // ===============================================

      setStats({

        // ---------------------------------------------
        // CUSTOMERS
        // Backend:
        // dashboard.total_customers
        // ---------------------------------------------

        totalCustomers:
          Number(
            dashboard?.total_customers ??
              dashboard?.totalCustomers ??
              0
          ),


        // ---------------------------------------------
        // PRODUCTS
        // Backend:
        // dashboard.total_products
        // ---------------------------------------------

        totalProducts:
          Number(
            dashboard?.total_products ??
              dashboard?.totalProducts ??
              0
          ),


        // ---------------------------------------------
        // INVENTORY
        // Backend:
        // dashboard.available_stock
        // ---------------------------------------------

        inventoryItems:
          Number(
            dashboard?.available_stock ??
              dashboard?.inventoryItems ??
              dashboard?.inventory ??
              0
          ),


        // ---------------------------------------------
        // SALES
        //
        // Use yearly sales amount as Total Sales.
        //
        // Backend:
        // dashboard.yearly_sales.sales_amount
        // ---------------------------------------------

        totalSales:
          Number(
            dashboard?.yearly_sales
              ?.sales_amount ??
              dashboard?.total_sales ??
              dashboard?.totalSales ??
              0
          ),
      });

    } catch (err) {

      console.error(
        "Dashboard Error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load dashboard"
      );

    } finally {

      setLoading(false);

    }
  };


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    loadDashboard();

  }, []);


  // ===================================================
  // FORMAT CURRENCY
  // ===================================================

  const formatCurrency = (value) => {

    const amount =
      Number(value) || 0;

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(amount);
  };


  // ===================================================
  // RENDER
  // ===================================================

  return (

    <div className="dashboard-page">


      {/* =================================================
          HEADER
          ================================================= */}

      <div className="dashboard-header">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Welcome to Chashma Plus
            Inventory Management System
          </p>

        </div>


        <button
          type="button"
          className="refresh-btn"
          onClick={loadDashboard}
          disabled={loading}
        >

          {loading
            ? "Loading..."
            : "Refresh"}

        </button>

      </div>


      {/* =================================================
          ERROR
          ================================================= */}

      {error && (

        <div className="dashboard-error">

          {error}

        </div>

      )}


      {/* =================================================
          STAT CARDS
          ================================================= */}

      <div className="dashboard-stats">


        {/* ===============================================
            CUSTOMERS
            =============================================== */}

        <div className="stat-card">

          <div className="stat-icon">
            ♟
          </div>

          <div className="stat-content">

            <span className="stat-title">
              Total Customers
            </span>

            <strong>

              {loading
                ? "..."
                : stats.totalCustomers}

            </strong>

          </div>

        </div>


        {/* ===============================================
            PRODUCTS
            =============================================== */}

        <div className="stat-card">

          <div className="stat-icon">
            ▣
          </div>

          <div className="stat-content">

            <span className="stat-title">
              Total Products
            </span>

            <strong>

              {loading
                ? "..."
                : stats.totalProducts}

            </strong>

          </div>

        </div>


        {/* ===============================================
            INVENTORY
            =============================================== */}

        <div className="stat-card">

          <div className="stat-icon">
            ▤
          </div>

          <div className="stat-content">

            <span className="stat-title">
              Inventory Items
            </span>

            <strong>

              {loading
                ? "..."
                : stats.inventoryItems}

            </strong>

          </div>

        </div>


        {/* ===============================================
            SALES
            =============================================== */}

        <div className="stat-card">

          <div className="stat-icon">
            ₹
          </div>

          <div className="stat-content">

            <span className="stat-title">
              Total Sales
            </span>

            <strong>

              {loading
                ? "..."
                : formatCurrency(
                    stats.totalSales
                  )}

            </strong>

          </div>

        </div>

      </div>


      {/* =================================================
          QUICK ACTIONS
          ================================================= */}

      <section className="quick-actions-section">


        <div className="section-heading">

          <h2>
            Quick Actions
          </h2>

          <p>
            Quickly access important
            inventory operations.
          </p>

        </div>


        <div className="quick-actions-grid">


          {/* =============================================
              CUSTOMERS
              ============================================= */}

          <Link
            to="/customers"
            className="quick-action-card"
          >

            <div className="quick-action-icon">
              ♟
            </div>

            <div>

              <h3>
                Customers
              </h3>

              <p>
                Manage customers
              </p>

            </div>

          </Link>


          {/* =============================================
              PRODUCTS
              ============================================= */}

          <Link
            to="/products"
            className="quick-action-card"
          >

            <div className="quick-action-icon">
              ▣
            </div>

            <div>

              <h3>
                Products
              </h3>

              <p>
                Manage products
              </p>

            </div>

          </Link>


          {/* =============================================
              INVENTORY
              ============================================= */}

          <Link
            to="/inventory"
            className="quick-action-card"
          >

            <div className="quick-action-icon">
              ▤
            </div>

            <div>

              <h3>
                Inventory
              </h3>

              <p>
                Check stock
              </p>

            </div>

          </Link>


          {/* =============================================
              EYE TESTING
              ============================================= */}

          <Link
            to="/eye-testing"
            className="quick-action-card"
          >

            <div className="quick-action-icon">
              ◉
            </div>

            <div>

              <h3>
                Eye Testing
              </h3>

              <p>
                Manage eye tests
              </p>

            </div>

          </Link>


          {/* =============================================
              SALES
              ============================================= */}

          <Link
            to="/sales"
            className="quick-action-card"
          >

            <div className="quick-action-icon">
              ₹
            </div>

            <div>

              <h3>
                Sales
              </h3>

              <p>
                Manage sales
              </p>

            </div>

          </Link>


        </div>

      </section>


    </div>

  );
};


export default Dashboard;