import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "▦",
    },
    {
      label: "Customers",
      path: "/customers",
      icon: "♙",
    },
    {
      label: "Products",
      path: "/products",
      icon: "▣",
    },
    {
      label: "Inventory",
      path: "/inventory",
      icon: "▤",
    },
    {
      label: "Eye Testing",
      path: "/eye-testing",
      icon: "◉",
    },
    {
      label: "Sales",
      path: "/sales",
      icon: "₹",
    },
  ];

  const handleNavigation = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    if (onClose) {
      onClose();
    }

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`sidebar ${
          isOpen ? "sidebar-open" : ""
        }`}
      >
        {/* BRAND */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            CP
          </div>

          <div className="sidebar-brand-text">
            <h2>Chashma Plus</h2>
            <span>Inventory</span>
          </div>

          {/* MOBILE CLOSE */}
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        {/* NAVIGATION */}
        <nav
          className="sidebar-navigation"
          aria-label="Main navigation"
        >
          <div className="sidebar-section-title">
            MENU
          </div>

          <div className="sidebar-menu">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavigation}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive
                      ? "sidebar-link-active"
                      : ""
                  }`
                }
              >
                <span className="sidebar-link-icon">
                  {item.icon}
                </span>

                <span className="sidebar-link-label">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* BOTTOM */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span className="sidebar-link-icon">
              ↪
            </span>

            <span className="sidebar-link-label">
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;