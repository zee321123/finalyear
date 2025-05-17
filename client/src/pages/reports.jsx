import React, { useEffect, useState, useRef, useContext, useCallback } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { saveAs } from 'file-saver';
import 'chart.js/auto';
import './reports.css';
import { CategoryContext } from '../context/categorycontext';
import { SearchContext } from '../context/searchcontext';
import { FaFileCsv, FaFilePdf } from 'react-icons/fa';

export default function Reports() {
  const { categories } = useContext(CategoryContext);
  const { searchTerm } = useContext(SearchContext);

  const [report, setReport] = useState(null);
  const [allTxns, setAllTxns] = useState([]);
  const [filteredTxns, setFilteredTxns] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [toast, setToast] = useState({ show: false, message: '' });

  const doughnutRef = useRef(null);
  const barRef = useRef(null);

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const getCurrencySymbol = (code) => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'د.إ' };
    return symbols[code] || code;
  };

  const fetchReport = useCallback(() => {
    const startTime = Date.now();
    const token = localStorage.getItem('token');
    if (!token) { setError('Not authenticated'); setLoading(false); return; }

    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);

    const fetchData = async () => {
      try {
        const reportPromise = fetch(`http://localhost:5000/api/reports?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.ok ? r.json() : Promise.reject(`Status ${r.status}`));

        const txnPromise = fetch('http://localhost:5000/api/transactions', {
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
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 2000 - elapsed);
        setTimeout(() => setLoading(false), delay);
      }
    };

    fetchData();
  }, [start, end]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    const handler = () => {
      fetchReport();
    };
    window.addEventListener('transactionsUpdated', handler);
    return () => {
      window.removeEventListener('transactionsUpdated', handler);
    };
  }, [fetchReport]);

  const getCategoryName = id => {
    if (!id) return 'Uncategorized';
    const cat = categories.find(c => c._id === id);
    return cat ? cat.name : 'Uncategorized';
  };

  const exportCSV = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/export/csv', {
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

  const exportPDF = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/export/pdf', {
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

  if (error) return <p className="reports-error">{error}</p>;
  if (!report) return null;

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

  const search = searchTerm.toLowerCase();
  const searchFilteredTxns = displayedTxns.filter(tx =>
    tx.description?.toLowerCase().includes(search) ||
    tx.type?.toLowerCase().includes(search) ||
    getCategoryName(tx.category)?.toLowerCase().includes(search)
  );

  const totalIncome = dateFilteredTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = dateFilteredTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const doughnutData = {
    labels: ['Income', 'Expenses'],
    datasets: [{ data: [totalIncome, totalExpenses] }]
  };

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

  return (
    <div className="reports-page">
      <h1>Financial Reports</h1>

      <div className="date-filters">
        <label>Start Date<input type="date" value={start} onChange={e => setStart(e.target.value)} /></label>
        <label>End Date<input type="date" value={end} onChange={e => setEnd(e.target.value)} /></label>
        {isFiltered && <button className="clear-filter-btn" onClick={clearFilters}>Clear Filters</button>}
      </div>

      <div className="chart-container">
        <h2>Breakdown by Category</h2>
        <Bar ref={barRef} data={barData} options={chartOptions} onClick={handleBarClick} />
      </div>

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

      <div className="chart-container">
        <h2>Income vs. Expenses</h2>
        <Doughnut ref={doughnutRef} data={doughnutData} options={chartOptions} onClick={handlePieClick} />
      </div>

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

      {toast.show && (
        <div className="toast-notification">
          {toast.message}
        </div>
      )}
    </div>
  );
}
