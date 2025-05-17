// client/src/context/userprovider.jsx
import React, { useState, useEffect } from "react";
import { UserContext } from "./usercontext";
const API = import.meta.env.VITE_API_URL;


const defaultProfile = { avatarUrl: "", fullName: "" };

export const UserProvider = ({ children }) => {
  const [profile, setProfile] = useState(defaultProfile);

  // ✅ Reset profile on logout
  const resetProfile = () => setProfile(defaultProfile);

  // ✅ Load fresh profile on mount (if token exists)
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

  return (
    <UserContext.Provider value={{ profile, setProfile, resetProfile }}>
      {children}
    </UserContext.Provider>
  );
};
