import React, { useState, useEffect, useContext, useCallback } from 'react';
import './categories.css';
import { CategoryContext } from '../context/categorycontext';
import { SearchContext } from '../context/searchcontext';
import {
  FaCog,
  FaFileCsv,
  FaFilePdf,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL;


export default function Categories() {
  const { categories, fetchCategories } = useContext(CategoryContext);
  const { searchTerm } = useContext(SearchContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: '',
    onConfirm: null
  });

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const checkExportAllowed = async () => {
    if (role === 'admin') return true;
    try {
      const res = await fetch(`${API_URL}/api/export/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (!result.allowed) showToast('❌ Export limit reached. Upgrade to Premium.');
      return result.allowed;
    } catch {
      showToast('❌ Export check failed.');
      return false;
    }
  };

  const logExport = async (type) => {
    try {
      const res = await fetch(`${API_URL}/api/export/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.message || 'Export failed'}`);
        return false;
      }
      return true;
    } catch {
      showToast('❌ Export log failed.');
      return false;
    }
  };

  const exportCategoryCSV = async (cat) => {
    const allowed = await checkExportAllowed();
    if (!allowed) return;
    const logged = await logExport('csv');
    if (!logged) return;

    const header = ['Date', 'Description', 'Amount', 'Category', 'Type'];
    const rows = cat.transactions.map((tx) => [
      new Date(tx.date).toLocaleDateString(),
      tx.description,
      tx.amount.toFixed(2),
      cat.name,
      cat.type
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    saveAs(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      `${cat.name}_transactions.csv`
    );
    showToast(`✅ ${cat.name} CSV exported!`);
  };

  const exportCategoryPDF = async (cat) => {
    const allowed = await checkExportAllowed();
    if (!allowed) return;
    const logged = await logExport('pdf');
    if (!logged) return;

    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Date', 'Description', 'Amount', 'Category', 'Type']],
      body: cat.transactions.map((tx) => [
        new Date(tx.date).toLocaleDateString(),
        tx.description,
        tx.amount.toFixed(2),
        cat.name,
        cat.type
      ]),
      startY: 20
    });
    doc.text(cat.name, 14, 15);
    doc.save(`${cat.name}_transactions.pdf`);
    showToast(`✅ ${cat.name} PDF exported!`);
  };

  const handleExportAllCSV = async () => {
    const allowed = await checkExportAllowed();
    if (!allowed) return;
    const logged = await logExport('csv');
    if (!logged) return;

    const allTxns = grouped.flatMap((cat) =>
      cat.transactions.map((tx) => [
        new Date(tx.date).toLocaleDateString(),
        tx.description,
        tx.amount.toFixed(2),
        cat.name,
        cat.type
      ])
    );

    const header = ['Date', 'Description', 'Amount', 'Category', 'Type'];
    const csv = [header, ...allTxns].map((r) => r.join(',')).join('\n');
    saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'all_transactions.csv');
    showToast('✅ All transactions exported as CSV');
  };

  const handleExportAllPDF = async () => {
    const allowed = await checkExportAllowed();
    if (!allowed) return;
    const logged = await logExport('pdf');
    if (!logged) return;

    const allTxns = grouped.flatMap((cat) =>
      cat.transactions.map((tx) => [
        new Date(tx.date).toLocaleDateString(),
        tx.description,
        tx.amount.toFixed(2),
        cat.name,
        cat.type
      ])
    );

    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Date', 'Description', 'Amount', 'Category', 'Type']],
      body: allTxns,
      startY: 20
    });
    doc.text('All Transactions', 14, 15);
    doc.save('all_transactions.pdf');
    showToast('✅ All transactions exported as PDF');
  };

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setTransactions(data);
      setError('');
    } catch {
      setError('Could not load transactions');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    fetchCategories();
    loadTransactions();
  }, [fetchCategories, loadTransactions]);

  const handleDeleteTransaction = (txId) => {
    setConfirmModal({
      show: true,
      message: 'Are you sure you want to delete this transaction?',
      onConfirm: async () => {
        const res = await fetch(`${API_URL}/api/transactions/${txId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          showToast('Transaction deleted');
          loadTransactions();
          window.dispatchEvent(new Event('transactionsUpdated'));
        } else {
          const data = await res.json();
          showToast(`Delete failed: ${data.message || 'Unknown error'}`);
        }
      }
    });
  };

  const handleDeleteCategory = (id) => {
    setConfirmModal({
      show: true,
      message: 'Are you sure you want to delete this category and its transactions?',
      onConfirm: async () => {
        await fetch(`${API_URL}/api/categories/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCategories();
        loadTransactions();
        window.dispatchEvent(new Event('transactionsUpdated'));
        setOpenMenu(null);
      }
    });
  };

  const handleDeleteSelected = () => {
    if (!selectedCats.length) {
      setSelectMode(false);
      return;
    }
    setConfirmModal({
      show: true,
      message: `Are you sure you want to delete ${selectedCats.length} selected categories and their transactions?`,
      onConfirm: async () => {
        await Promise.all(
          selectedCats.map((id) =>
            fetch(`${API_URL}/api/categories/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        );
        setSelectedCats([]);
        setSelectMode(false);
        fetchCategories();
        loadTransactions();
        window.dispatchEvent(new Event('transactionsUpdated'));
      }
    });
  };

  const handleSelectCat = (id) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredCats = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const grouped = filteredCats.map((cat) => ({
    ...cat,
    transactions: transactions.filter((tx) => tx.category === cat._id)
  }));

  if (loading) {
    return (
      <div className="categories-container loading-state">
        <div className="fancy-loader">
          <div className="dot-group">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <p>Loading Categories...</p>
        </div>
      </div>
    );
  }

  if (error) return <p className="center error">{error}</p>;

  if (!grouped.length) {
    return (
      <div className="categories-container">
        <h1>Categories</h1>
        <p className="empty">
          No categories yet. Add a category from the Add Transaction page.
        </p>
      </div>
    );
  }

  return (
    <div className="categories-container">
      <h1>Categories</h1>

      <div className="toolbar">
        <div className="export-group">
          <button className="btn export-all" onClick={handleExportAllCSV}>
            <FaFileCsv style={{ marginRight: '8px' }} /> Export All CSV
          </button>
          <button className="btn export-all" onClick={handleExportAllPDF}>
            <FaFilePdf style={{ marginRight: '8px' }} /> Export All PDF
          </button>
        </div>
        {selectMode ? (
          <button className="btn delete-all small" onClick={handleDeleteSelected}>
            <FaTrash style={{ marginRight: '8px' }} /> Delete Selected (
            {selectedCats.length})
          </button>
        ) : (
          <button className="btn delete-all" onClick={() => setSelectMode(true)}>
            <FaTrash style={{ marginRight: '8px' }} /> Delete All
          </button>
        )}
      </div>

      {grouped.map((cat) => (
        <section key={cat._id} className="category-section">
          <div className="section-header">
            <label>
              {selectMode && (
                <input
                  type="checkbox"
                  checked={selectedCats.includes(cat._id)}
                  onChange={() => handleSelectCat(cat._id)}
                />
              )}{' '}
              {cat.name}{' '}
              <span className={`type-label ${cat.type}`}>
                {cat.type === 'income' ? '💰 Income' : '💸 Expense'}
              </span>
            </label>
            <div className="actions">
              <FaCog
                className="settings-btn"
                onClick={() =>
                  setOpenMenu(openMenu === cat._id ? null : cat._id)
                }
              />
              {openMenu === cat._id && (
                <div className="settings-menu">
                  <button
                    className="btn small delete"
                    onClick={() => handleDeleteCategory(cat._id)}>
                    <FaTrash style={{ marginRight: '6px' }} /> Delete
                  </button>
                  <button
                    className="btn small export"
                    onClick={() => {
                      exportCategoryCSV(cat);
                      setOpenMenu(null);
                    }}>
                    <FaFileCsv style={{ marginRight: '6px' }} /> CSV
                  </button>
                  <button
                    className="btn small export"
                    onClick={() => {
                      exportCategoryPDF(cat);
                      setOpenMenu(null);
                    }}>
                    <FaFilePdf style={{ marginRight: '6px' }} /> PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {cat.transactions.length ? (
            <table className="categories-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cat.transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td className="date-cell" data-label="Date">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="description-cell" data-label="Description" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className={`amount-cell ${cat.type}`} data-label="Amount">
                      {cat.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                    <td className="actions-cell" data-label="Actions">
                      <button
                        className="btn small delete"
                        onClick={() => handleDeleteTransaction(tx._id)}>
                        <FaTrash style={{ marginRight: '6px' }} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">No transactions in this category.</p>
          )}
        </section>
      ))}

      {toast.show && (
        <div className="toast-notification">{toast.message}</div>
      )}

      {confirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>{confirmModal.message}</p>
            <div className="modal-actions">
              <button
                className="btn confirm-yes"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({
                    show: false,
                    message: '',
                    onConfirm: null
                  });
                }}>
                <FaCheckCircle style={{ marginRight: '6px' }} /> Yes
              </button>
              <button
                className="btn confirm-no"
                onClick={() =>
                  setConfirmModal({
                    show: false,
                    message: '',
                    onConfirm: null
                  })
                }>
                <FaTimesCircle style={{ marginRight: '6px' }} /> No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
