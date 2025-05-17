import React, { useState, useEffect, useContext } from "react";
import { NavLink } from "react-router-dom";
import {
  FaChartPie,
  FaPlus,
  FaFileAlt,
  FaFolder,
  FaFileInvoice,
  FaRedo,
  FaCog,
} from "react-icons/fa";
import { UserContext } from "../context/usercontext";
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useContext(UserContext);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const avatarSrc = profile.avatarUrl
    ? `http://localhost:5000${profile.avatarUrl}`
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
          {/* ✅ Modern User Profile */}
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

export default Sidebar;
