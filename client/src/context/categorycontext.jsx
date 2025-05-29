// Import React and required hooks
import React, { createContext, useState, useCallback, useEffect } from 'react';

// Import the backend API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;


// named export of context
export const CategoryContext = createContext({
  categories: [],
  fetchCategories: () => Promise.resolve([])
});

// Context provider to wrap around components that need access to categories
export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  // Fetch categories from the backend API
  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/categories`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` // Send token in Authorization header
        }
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      setCategories(data);
      return data; // Return data for optional reuse
    } catch (err) {
      console.error('Category fetch error:', err);
      return []; // Return empty list on error
    }
  }, []);

  // Automatically fetch categories when the component mounts
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <CategoryContext.Provider value={{ categories, fetchCategories }}>
      {children}
    </CategoryContext.Provider>
  );
}