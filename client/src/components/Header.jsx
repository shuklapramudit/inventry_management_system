import React from "react";
import { useLocation } from "react-router-dom";
import "./Header.css";

const Header = ({ onMenuClick }) => {
  const location = useLocation();

  const pageTitles = {
    "/dashboard": "Dashboard",
    "/customers": "Customers",
    "/products": "Products",
    "/inventory": "Inventory",
    "/eye-testing": "Eye Testing",
    "/sales": "Sales",
  };

  const pageSubtitles = {
    "/dashboard":
      "Overview of your inventory management system.",

    "/customers":
      "Manage your Chashma Plus customers.",

    "/products":
      "Manage your Chashma Plus products.",

    "/inventory":
      "Manage and monitor your product stock.",

    "/eye-testing":
      "Manage customer eye testing records.",

    "/sales":
      "Manage sales and payment records.",
  };

  const title =
    pageTitles[location.pathname] ||
    "Chashma Plus";

  const subtitle =
    pageSubtitles[location.pathname] ||
    "Inventory Management System";

  const getUser = () => {
    try {
      const storedUser =
        localStorage.getItem("user");

      if (!storedUser) {
        return {
          name: "Admin",
          email: "",
        };
      }

      const user =
        JSON.parse(storedUser);

      return {
        name:
          user?.name ||
          user?.username ||
          user?.email?.split("@")[0] ||
          "Admin",

        email:
          user?.email || "",
      };
    } catch {
      return {
        name: "Admin",
        email: "",
      };
    }
  };

  const user = getUser();

  return (
    <header className="app-header">
      {/* =========================================
          LEFT
      ========================================= */}

      <div className="header-left">

        {/* MOBILE MENU BUTTON */}

        <button
          type="button"
          className="header-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* PAGE INFORMATION */}

        <div className="header-page-info">
          <h1>{title}</h1>

          <p>{subtitle}</p>
        </div>
      </div>

      {/* =========================================
          RIGHT
      ========================================= */}

      <div className="header-right">

        {/* SYSTEM STATUS */}

        <div className="header-status">
          <span className="header-status-dot"></span>

          <span>
            System Active
          </span>
        </div>

        {/* USER */}

        <div className="header-user">

          <div className="header-user-avatar">
            {user.name
              ?.charAt(0)
              ?.toUpperCase() || "A"}
          </div>

          <div className="header-user-info">
            <strong>
              {user.name}
            </strong>

            {user.email && (
              <span>
                {user.email}
              </span>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;