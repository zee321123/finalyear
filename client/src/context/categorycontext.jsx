/* eslint-disable react-refresh/only-export-components */

// client/src/context/categorycontext.jsx
import React, { createContext, useState, useCallback, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;


// named export of context
export const CategoryContext = createContext({
  categories: [],
  fetchCategories: () => Promise.resolve([])
});

// provider component
export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/categories`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();
      setCategories(data);
      return data;
    } catch (err) {
      console.error('Category fetch error:', err);
      return [];
    }
  }, []);

  // load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <CategoryContext.Provider value={{ categories, fetchCategories }}>
      {children}
    </CategoryContext.Provider>
  );
}
1