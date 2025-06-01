import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './receipts.css';
import { SearchContext } from '../context/searchcontext';
const API = import.meta.env.VITE_API_URL;


export default function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [urls, setUrls] = useState({}); // { [id]: objectURL }
  const [categoryMap, setCategoryMap] = useState({}); // { [categoryId]: categoryName }
  const [loading, setLoading] = useState(true); // ✅ New loading state
  const { searchTerm } = useContext(SearchContext);

  useEffect(() => {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    try {
      const start = Date.now();

      // 1. Fetch categories
      const categoryRes = await axios.get(`${API}/api/categories`, { headers });
      const map = {};
      categoryRes.data.forEach(cat => {
        map[cat._id || cat.id] = cat.name;
      });
      setCategoryMap(map);

      // 2. Fetch receipts
      const receiptRes = await axios.get(`${API}/api/receipts`, { headers });
      setReceipts(receiptRes.data);

      // 3. Fetch images in parallel
      await Promise.all(receiptRes.data.map(r =>
        axios.get(`${API}/api/receipts/${r.id}`, {
          headers,
          responseType: 'blob'
        })
          .then(resp => {
            const objectUrl = URL.createObjectURL(resp.data);
            setUrls(prev => ({ ...prev, [r.id]: objectUrl }));
          })
          .catch(console.error)
      ));

      // ⏳ Ensure 3 seconds loading minimum
      const elapsed = Date.now() - start;
      const delay = Math.max(0, 2000 - elapsed);
      setTimeout(() => setLoading(false), delay);
    } catch (err) {
      console.error('❌ Failed to load receipts or categories:', err);
      setLoading(false); // still hide loader even on error
    }
  };

  fetchAll();
}, []);

  // Unique list of category IDs from receipts
  const categoryIds = Array.from(new Set(receipts.map(r => r.category)));

  // Filtered by dropdown
  const filteredByCategory = filter === 'all'
    ? receipts
    : receipts.filter(r => r.category === filter);

  // Apply search term on top
  const search = searchTerm.toLowerCase();
  const filtered = filteredByCategory.filter(r =>
    categoryMap[r.category]?.toLowerCase().includes(search)
  );

  //  Full-page loading screen
  if (loading) {
    return (
      <div className="receipts-page loading-state">
        <div className="fancy-loader">
          <div className="dot-group">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p>Loading Receipts...</p>
        </div>
      </div>
    );
  }

  // If no receipts found
  if (receipts.length === 0) {
    return (
      <div className="receipts-page">
        <h1>Receipts</h1>
        <p>No receipts found.</p>
      </div>
    );
  }

  return (
    <div className="receipts-page">
      <h1>Receipts</h1>

      <label>
        Category:&nbsp;
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All</option>
          {categoryIds.map(id => (
            <option key={id} value={id}>
              {categoryMap[id] || id}
            </option>
          ))}
        </select>
      </label>

      <div className="receipts-grid">
        {filtered.map(r => (
          <div key={r.id} className="receipt-card">
            {urls[r.id]
              ? (
                <a href={urls[r.id]} target="_blank" rel="noopener noreferrer">
                  <img src={urls[r.id]} className="receipt-thumb" alt="Receipt" />
                </a>
              ) : (
                <div className="receipt-thumb placeholder">Loading…</div>
              )}
            <p>{categoryMap[r.category] || r.category}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
