// Import React and hooks
import React, { useState, useEffect } from "react";
import { UserContext } from "./usercontext"; // Import the UserContext we created earlier
const API = import.meta.env.VITE_API_URL; // Get backend API URL from environment variables

// Define default empty profile structure
const defaultProfile = { avatarUrl: "", fullName: "" };

export const UserProvider = ({ children }) => {
  const [profile, setProfile] = useState(defaultProfile);   // State to store user's profile info

  //  Reset profile on logout
  const resetProfile = () => setProfile(defaultProfile);

  // Load fresh profile on mount (if token exists)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setProfile({
          avatarUrl: data.avatarUrl || "",
          fullName: data.fullName || "",
        });
      })
      .catch(err => console.error("❌ Error fetching profile:", err));
  }, []);

  // Provide profile data and setters to child components
  return (
    <UserContext.Provider value={{ profile, setProfile, resetProfile }}>
      {children}
    </UserContext.Provider>
  );
};
