import React, { useContext, useEffect, useState } from "react";
import "./header.css";
import { FiBell, FiSearch } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { SearchContext } from "../context/searchcontext";

const Header = () => {
  const { searchTerm, setSearchTerm } = useContext(SearchContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("⚠️ No token found in localStorage");
      return;
    }

    const checkPremiumStatus = async () => {
      try {
        console.log("📡 Fetching profile with token...");
        const res = await fetch("http://localhost:5000/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const data = await res.json();
        console.log("💡 Profile data in Header:", data);

        if (data?.isPremium === true) {
          console.log("🔥 Setting Premium to TRUE!");
          setIsPremium(true);
        } else {
          console.log("⚠️ isPremium was FALSE or MISSING");
        }

        // ✅ Clean the URL if ?paid=true
        if (location.search.includes("paid=true")) {
          console.log("🔁 Removing ?paid=true from URL");
          const url = new URL(window.location);
          url.searchParams.delete("paid");
          window.history.replaceState({}, "", url);
        }
      } catch (err) {
        console.error("❌ Failed to fetch profile:", err);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Failed to fetch notifications:", err);
        setNotifications([]);
      }
    };

    console.log("🚀 useEffect triggered. Checking premium and notifications.");
    fetchNotifications();
    checkPremiumStatus();
  }, [location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("🔍 Searching for:", searchTerm);
  };

  const markAsRead = (index) => {
    const updated = [...notifications];
    updated[index].read = true;
    setNotifications(updated);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  console.log("🎯 isPremium state:", isPremium);

  return (
    <header className="app-header">
      {/* Search Bar */}
      <form className="search-bar" onSubmit={handleSearch}>
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </form>

      {/* Notifications & Premium/Upgrade */}
      <div className="header-actions">
        <div className="notification-wrapper">
          <button
            className="notification-btn"
            aria-label="Notifications"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <FiBell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showDropdown && (
            <div className="notification-dropdown">
              <h4>Notifications</h4>
              <ul>
                {notifications.length === 0 && (
                  <li className="notification-empty">No notifications</li>
                )}
                {notifications.map((notif, index) => (
                  <li key={index} className={notif.read ? "read" : "unread"}>
                    {notif.message}
                    {!notif.read && (
                      <button onClick={() => markAsRead(index)}>Dismiss</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ✅ Premium label or Upgrade button */}
        {isPremium ? (
          <span className="upgrade-btn disabled-premium">
            <span role="img" aria-label="crown" className="crown-icon">👑</span>Premium
          </span>
        ) : (
         <button className="upgrade-btn" onClick={() => navigate("/upgrade")}>
  <span role="img" aria-label="crown" className="crown-icon">👑</span> Upgrade
</button>

        )}
      </div>
    </header>
  );
};

export default Header;
