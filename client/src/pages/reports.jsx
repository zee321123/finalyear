// Import necessary React hooks and chart components
import React, { useEffect, useState, useRef, useContext, useCallback } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2'; // Chart types from Chart.js
import { saveAs } from 'file-saver'; // For downloading files
import 'chart.js/auto'; // Automatically registers chart components
import './reports.css'; // Custom styles for the reports page

// Import context providers for category and search
import { CategoryContext } from '../context/categorycontext';
import { SearchContext } from '../context/searchcontext';

// Icons for export buttons
import { FaFileCsv, FaFilePdf } from 'react-icons/fa';

// API base URL from environment variable
const API = import.meta.env.VITE_API_URL;

export default function Reports() {
  // Context values
  const { categories } = useContext(CategoryContext);
  const { searchTerm } = useContext(SearchContext);

  // State variables
  const [report, setReport] = useState(null); // Summary report data
  const [allTxns, setAllTxns] = useState([]); // All transactions
  const [filteredTxns, setFilteredTxns] = useState(null); // Filtered transactions
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });

  // Refs for chart instances
  const doughnutRef = useRef(null);
  const barRef = useRef(null);

  // Function to show temporary toast notifications
  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // Currency symbol lookup
  const getCurrencySymbol = (code) => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'د.إ' };
    return symbols[code] || code;
  };

  // Fetch report and transactions data from backend
  const fetchReport = useCallback(() => {
    const startTime = Date.now();
    const token = localStorage.getItem('token');
    if (!token) { setError('Not authenticated'); setLoading(false); return; }

    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);

    const fetchData = async () => {
      try {
        // Parallel requests for report and transactions
        const reportPromise = fetch(`${API}/api/reports?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : Promise.reject(`Status ${r.status}`));

        const txnPromise = fetch(`${API}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : Promise.reject(`Status ${r.status}`));

        const [reportData, txnData] = await Promise.all([reportPromise, txnPromise]);

        setReport(reportData);
        setAllTxns(txnData);
        setError('');
      } catch (err) {
        console.error('Error loading reports:', err);
        setError('Failed to load reports');
      } finally {
        // Delay ensures smooth loading UX
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 2000 - elapsed);
        setTimeout(() => setLoading(false), delay);
      }
    };

    fetchData();
  }, [start, end]);

  // Fetch report on initial render and when filters change
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Re-fetch report when custom event is triggered
  useEffect(() => {
    const handler = () => {
      fetchReport();
    };
    window.addEventListener('transactionsUpdated', handler);
    return () => {
      window.removeEventListener('transactionsUpdated', handler);
    };
  }, [fetchReport]);

  // Helper to get category name from ID
  const getCategoryName = id => {
    if (!id) return 'Uncategorized';
    const cat = categories.find(c => c._id === id);
    return cat ? cat.name : 'Uncategorized';
  };

  // Export transactions as CSV
  const exportCSV = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/api/export/csv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(`❌ ${data.message || 'CSV export failed'}`);
        return;
      }

      const blob = await res.blob();
      saveAs(blob, 'transactions.csv');
      showToast('✅ CSV exported successfully!');
    } catch (err) {
      console.error('❌ CSV export error:', err);
      showToast('❌ CSV export failed');
    }
  };

  // Export transactions as PDF
  const exportPDF = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/api/export/pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(`❌ ${data.message || 'PDF export failed'}`);
        return;
      }

      const blob = await res.blob();
      saveAs(blob, 'transactions.pdf');
      showToast('✅ PDF exported successfully!');
    } catch (err) {
      console.error('❌ PDF export error:', err);
      showToast('❌ PDF export failed');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="reports-page loading-state">
        <div className="fancy-loader">
          <div className="dot-group">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p>Generating Reports...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) return <p className="reports-error">{error}</p>;
  if (!report) return null;

  // Filter transactions by date
  const inRange = txn => {
    const d = new Date(txn.date);
    if (start && d < new Date(start)) return false;
    if (end) {
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      if (d > e) return false;
    }
    return true;
  };

  const dateFilteredTxns = allTxns.filter(inRange);
  const displayedTxns = filteredTxns !== null ? filteredTxns : dateFilteredTxns;
  const isFiltered = filteredTxns !== null || start || end;

  // Apply search filter
  const search = searchTerm.toLowerCase();
  const searchFilteredTxns = displayedTxns.filter(tx =>
    tx.description?.toLowerCase().includes(search) ||
    tx.type?.toLowerCase().includes(search) ||
    getCategoryName(tx.category)?.toLowerCase().includes(search)
  );

  // Calculate totals for charts
  const totalIncome = dateFilteredTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = dateFilteredTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const doughnutData = {
    labels: ['Income', 'Expenses'],
    datasets: [{ data: [totalIncome, totalExpenses] }]
  };

  // Bar chart: category totals
  const categoryMap = dateFilteredTxns.reduce((acc, t) => {
    const id = t.category;
    acc[id] = (acc[id] || 0) + t.amount;
    return acc;
  }, {});

  const namedCategoryMap = {};
  Object.entries(categoryMap).forEach(([id, total]) => {
    namedCategoryMap[getCategoryName(id)] = total;
  });

  const barData = {
    labels: Object.keys(namedCategoryMap),
    datasets: [{ data: Object.values(namedCategoryMap) }]
  };

  const showTrend = Array.isArray(report.trend) && report.trend.length > 0;
  const chartOptions = { responsive: true, maintainAspectRatio: false };

  // Chart click handlers
  const handlePieClick = evt => {
    const elems = doughnutRef.current?.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false) || [];
    if (!elems.length) return;
    const type = doughnutData.labels[elems[0].index].toLowerCase();
    setFilteredTxns(dateFilteredTxns.filter(t => t.type === type));
  };

  const handleBarClick = evt => {
    const elems = barRef.current?.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false) || [];
    if (!elems.length) return;
    const clicked = barData.labels[elems[0].index];
    setFilteredTxns(dateFilteredTxns.filter(t => getCategoryName(t.category) === clicked));
  };

  const clearFilters = () => { setFilteredTxns(null); setStart(''); setEnd(''); };

  // Render full reports page
  return (
    <div className="reports-page">
      <h1>Financial Reports</h1>

      {/* Date Filter UI */}
      <div className="date-filters">
        <label>Start Date<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
        <label>End Date<input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
        {isFiltered && <button className="clear-filter-btn" onClick={clearFilters}>Clear Filters</button>}
      </div>

      {/* Bar Chart: Category Breakdown */}
      <div className="chart-container">
        <h2>Breakdown by Category</h2>
        <Bar ref={barRef} data={barData} options={chartOptions} onClick={handleBarClick} />
      </div>

      {/* Line Chart: Income vs Expense Trend */}
      {showTrend && (
        <div className="chart-container">
          <h2>Trend: Income vs. Expenses</h2>
          <Line data={{
            labels: report.trend.map(d => d._id),
            datasets: [
              { label: 'Income', data: report.trend.map(d => d.income), fill: false, tension: 0.3 },
              { label: 'Expenses', data: report.trend.map(d => d.expense), fill: false, tension: 0.3 }
            ]
          }} options={{
            ...chartOptions,
            scales: {
              x: { title: { display: true, text: 'Period' } },
              y: { title: { display: true, text: 'Amount' }, beginAtZero: true }
            }
          }} />
        </div>
      )}

      {/* Doughnut Chart: Income vs Expense */}
      <div className="chart-container">
        <h2>Income vs. Expenses</h2>
        <Doughnut ref={doughnutRef} data={doughnutData} options={chartOptions} onClick={handlePieClick} />
      </div>

      {/* Transactions Table with Export Buttons */}
      <div className="transactions-table">
        <h2>
          Transactions ({searchFilteredTxns.length})
          <span className="table-actions">
            <button className="export-btn" onClick={exportCSV}>
              <FaFileCsv style={{ marginRight: '6px' }} />
              CSV
            </button>
            <button className="export-btn" onClick={exportPDF}>
              <FaFilePdf style={{ marginRight: '6px' }} />
              PDF
            </button>
          </span>
        </h2>
        <table>
          <thead>
            <tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {searchFilteredTxns.map(tx => (
              <tr key={tx._id}>
                <td>{new Date(tx.date).toLocaleDateString()}</td>
                <td>{tx.description}</td>
                <td>{getCategoryName(tx.category)}</td>
                <td>{tx.type}</td>
                <td>{getCurrencySymbol(tx.currency)}{tx.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toast message for exports */}
      {toast.show && (
        <div className="toast-notification">
          {toast.message}
        </div>
      )}
    </div>
  );
}
