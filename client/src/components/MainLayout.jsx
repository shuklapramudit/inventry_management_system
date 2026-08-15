import React, { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

import "./MainLayout.css";

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  return (
    <div className="main-layout">

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="main-layout-content">

        <Header
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main className="main-layout-main">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default MainLayout;