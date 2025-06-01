// Import necessary React tools and hooks
import React, { useContext, useEffect, useState } from "react";
// Import styling
import "./header.css";
// Import icons
import { FiBell, FiSearch } from "react-icons/fi";
// Import navigation tools from react-router
import { useNavigate, useLocation } from "react-router-dom";
// Import custom search context
import { SearchContext } from "../context/searchcontext";
// Get the backend API URL from environment variables
const API = import.meta.env.VITE_API_URL;


const Header = () => {
  const { searchTerm, setSearchTerm } = useContext(SearchContext);  // Access searchTerm and setSearchTerm from context
  const navigate = useNavigate();   // Router hooks
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);   // Local state for notifications and dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Fetch notifications and premium status on load or when URL query changes
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("⚠️ No token found in localStorage");
      return;
    }

    // Check if user is premium
    const checkPremiumStatus = async () => {
      try {
        console.log("📡 Fetching profile with token...");
        const res = await fetch(`${API}/api/profile`, {
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

    // Fetch user notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API}/api/notifications`, {
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
    fetchNotifications();     // Call both functions
    checkPremiumStatus();
  }, [location.search]);

  // Handle search form submit
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("🔍 Searching for:", searchTerm);
  };

  // Mark a specific notification as read
  const markAsRead = (index) => {
    const updated = [...notifications];
    updated[index].read = true;
    setNotifications(updated);
  };
  // Count unread notifications
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

        {/*  Premium label or Upgrade button */}
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
// Export the Header component
export default Header;
