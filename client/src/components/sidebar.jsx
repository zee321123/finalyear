// Import React and hooks
import React, { useState, useEffect, useContext } from "react";
// Import NavLink for routing
import { NavLink } from "react-router-dom";
// Import icons from react-icons
import {
  FaChartPie,
  FaPlus,
  FaFileAlt,
  FaFolder,
  FaFileInvoice,
  FaRedo,
  FaCog,
} from "react-icons/fa";
import { UserContext } from "../context/usercontext"; // Import user context to get profile data
// Import sidebar CSS styles
import "./sidebar.css";
// Get API URL from environment
const API = import.meta.env.VITE_API_URL;


const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);   // State for mobile sidebar toggle
  const { profile } = useContext(UserContext);   // Get user profile data from context

  // Collapse sidebar on window resize (desktop view)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set avatar image from profile, fallback to default avatar
  const avatarSrc = profile.avatarUrl
   ? `${API}${profile.avatarUrl}`
    : "https://ui-avatars.com/api/?name=User&background=1abc9c&color=fff&rounded=true";

  return (
    <>
      <button
        className={`toggle-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo & Title */}
        <div className="sidebar-header">
          <img src="/Logo2.jpg" alt="MoneyTrack Logo" className="sidebar-logo" />
          <span className="sidebar-title">MoneyTrack</span>
        </div>

        {/* Content Wrapper */}
        <div className="sidebar-content">
          {/* Modern User Profile */}
          <div className="sidebar-user">
            <img
              src={avatarSrc}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://ui-avatars.com/api/?name=User&background=1abc9c&color=fff&rounded=true";
              }}
              alt="User Avatar"
              className="user-avatar"
            />
            <div className="user-info">
              <div className="user-welcome">Welcome,</div>
              <div className="user-name">{profile.fullName || "User"}</div>
            </div>
          </div>

          {/* Navigation */}
          <ul className="menu">
            <li>
              <NavLink to="/dashboard" className={({ isActive }) =>
                `menu-item ${isActive ? "active-link" : ""}`}>
                <span className="icon"><FaChartPie /></span>
                <span className="label">Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/add-transaction" className={({ isActive }) =>
                `menu-item ${isActive ? "active-link" : ""}`}>
                <span className="icon"><FaPlus /></span>
                <span className="label">Add Transaction</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" className={({ isActive }) =>
                `menu-item ${isActive ? "active-link" : ""}`}>
                <span className="icon"><FaFileAlt /></span>
                <span className="label">Reports</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/categories" className={({ isActive }) =>
                `menu-item ${isActive ? "active-link" : ""}`}>
                <span className="icon"><FaFolder /></span>
                <span className="label">Categories</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/receipts" className={({ isActive }) =>
                `menu-item ${isActive ? "active-link" : ""}`}>
                <span className="icon"><FaFileInvoice /></span>
                <span className="label">Receipts</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/scheduled" className={({ isActive }) =>
                `menu-item ${isActive ? "active-link" : ""}`}>
                <span className="icon"><FaRedo /></span>
                <span className="label">Scheduled</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" className={({ isActive }) =>
                `menu-item ${isActive ? "active-link" : ""}`}>
                <span className="icon"><FaCog /></span>
                <span className="label">Settings</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
};

// Export the Sidebar component to use in the app layout
export default Sidebar;
