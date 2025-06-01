// Import global styles and necessary libraries
import './scheduled.css';
import { useState, useEffect, useCallback, useContext } from 'react';
import { FiEdit2, FiTrash2, FiSave, FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { SearchContext } from '../context/searchcontext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL; // Base API URL from environment variable

export default function Scheduled() {
  // Local state hooks
  const [rules, setRules] = useState([]); // Stores all scheduled rules
  const [form, setForm] = useState({
    title: '',
    type: 'income',
    amount: '',
    category: '',
    frequency: 'monthly',
    dayOfMonth: 1,
    month: 1,
    currency: 'USD',
  });

  const [error, setError] = useState(null); // Error message
  const [success, setSuccess] = useState(null); // Success message
  const [editingRuleId, setEditingRuleId] = useState(null); // ID of rule being edited
  const [showConfirm, setShowConfirm] = useState(false); // Controls confirmation modal
  const [ruleToDelete, setRuleToDelete] = useState(null); // ID of rule to delete
  const { searchTerm } = useContext(SearchContext); // Search input from context
  const token = localStorage.getItem('token'); // JWT token from local storage
  const [user, setUser] = useState(null); // Stores user data
  const [loading, setLoading] = useState(true); // Controls loading state

  // Fetch scheduled rules from the backend
  const fetchRules = useCallback(async () => {
    const start = Date.now();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/scheduled`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setRules(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load scheduled rules');
    } finally {
      const elapsed = Date.now() - start;
      const delay = Math.max(0, 2000 - elapsed); // Ensures 2s spinner display
      setTimeout(() => setLoading(false), delay);
    }
  }, [token]);

  // Fetch data on page load
  useEffect(() => {
    fetchRules();

    // Fetch user profile
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${API}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(data);
      } catch (err) {
        console.error('❌ Failed to fetch user info:', err);
      }
    };

    fetchUser();
  }, [fetchRules, token]);

  // Handle delete button click
  const handleDeleteClick = (id) => {
    setRuleToDelete(id);
    setShowConfirm(true); // Show confirmation modal
  };

  // Confirm deletion
  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API}/api/scheduled/${ruleToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      setSuccess('✅ Schedule deleted');
      setTimeout(() => setSuccess(null), 3000);
      fetchRules();
    } catch (err) {
      console.error(err);
      setError(err.message || '❌ Failed to delete schedule');
    } finally {
      setShowConfirm(false);
      setRuleToDelete(null);
    }
  };

  // Handle add/update form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const url = editingRuleId
        ? `${API}/api/scheduled/${editingRuleId}`
        : `${API}/api/scheduled`;
      const method = editingRuleId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Save failed');

      setSuccess(editingRuleId ? 'Schedule updated successfully!' : 'Schedule saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setEditingRuleId(null); // Reset form and editing state
      setForm({
        title: '',
        type: 'income',
        amount: '',
        category: '',
        frequency: 'monthly',
        dayOfMonth: 1,
        month: 1,
        currency: 'USD',
      });
      fetchRules();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // Month options for yearly frequency
  const months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
    { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
    { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' },
  ];

  // Currency symbol helper
  const getCurrencySymbol = (code) => ({ USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'د.إ' }[code] || code);

  // Filter rules by search term
  const filteredRules = rules.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loader while data is being fetched
  if (loading) {
    return (
      <div className="scheduled-container loading-state">
        <div className="fancy-loader">
          <div className="dot-group">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p>Loading Scheduled Transactions...</p>
        </div>
      </div>
    );
  }

  // Main return block with form and list
  return (
    <div className="scheduled-container">
      {/* Delete confirmation modal */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3>Are you sure?</h3>
            <p>This will permanently delete the schedule.</p>
            <div className="confirm-actions">
              <button className="btn cancel" onClick={() => setShowConfirm(false)}>
                <FiXCircle style={{ marginRight: '6px' }} /> Cancel
              </button>
              <button className="btn delete" onClick={confirmDelete}>
                <FiCheckCircle style={{ marginRight: '6px' }} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="scheduled-header">
        {editingRuleId ? 'Edit Scheduled Transaction' : 'Add Scheduled Transaction'}
      </h2>

      {/* Error and Success Messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Form for adding/updating a rule */}
      <form onSubmit={handleSubmit} className="scheduled-form">
        {/* Title Input */}
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input id="title" type="text" placeholder="e.g. Salary" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>

        {/* Type Selector */}
        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select id="type" value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        {/* Amount Input */}
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input id="amount" type="number" placeholder="Amount" value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        </div>

        {/* Currency Selector - Disabled for Free Users */}
        <div className="form-group">
          <label htmlFor="currency">Currency</label>
          {user && !(user.isPremium || user.role === 'admin') ? (
            <select id="currency" value={form.currency} disabled>
              <option value="USD">USD ($)</option>
            </select>
          ) : (
            <select id="currency" value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {["USD", "EUR", "GBP", "INR", "AED"].map(cur => (
                <option key={cur} value={cur}>{cur} ({getCurrencySymbol(cur)})</option>
              ))}
            </select>
          )}
        </div>

        {/* Category Input */}
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input id="category" type="text" placeholder="e.g. Food" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>

        {/* Frequency Selector */}
        <div className="form-group">
          <label htmlFor="frequency">Frequency</label>
          <select id="frequency" value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Day of Month Input */}
        <div className="form-group">
          <label htmlFor="dayOfMonth">Day of Month</label>
          <input id="dayOfMonth" type="number" min="1" max="31" value={form.dayOfMonth}
            onChange={(e) => setForm({ ...form, dayOfMonth: +e.target.value })} required />
        </div>

        {/* Month Selector (if frequency is yearly) */}
        {form.frequency === 'yearly' && (
          <div className="form-group">
            <label htmlFor="month">Month</label>
            <select id="month" value={form.month}
              onChange={(e) => setForm({ ...form, month: +e.target.value })} required>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Submit and Cancel Buttons */}
        <button type="submit" className="btn-primary full-width">
          <FiSave style={{ marginRight: '8px' }} />
          {editingRuleId ? 'Update Schedule' : 'Save Schedule'}
        </button>

        {editingRuleId && (
          <button type="button" className="btn-secondary full-width"
            onClick={() => {
              setEditingRuleId(null);
              setForm({
                title: '', type: 'income', amount: '', category: '',
                frequency: 'monthly', dayOfMonth: 1, month: 1, currency: 'USD'
              });
            }}>
            <FiXCircle style={{ marginRight: '8px' }} /> Cancel
          </button>
        )}
      </form>

      {/* Scheduled List */}
      <h2 style={{ textAlign: 'left', marginTop: '2rem' }}>Your Scheduled Transactions</h2>

      {filteredRules.length === 0 ? (
        <p>No schedules found.</p>
      ) : (
        <table className="scheduled-table">
          <thead>
            <tr>
              <th>Title</th><th>Type</th><th>Amount</th><th>Category</th>
              <th>Frequency</th><th>Next Run</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule) => (
              <tr key={rule._id}>
                <td>{rule.title}</td>
                <td>{rule.type}</td>
                <td>{getCurrencySymbol(rule.currency || 'USD')}{parseFloat(rule.amount).toFixed(2)}</td>
                <td>{rule.category || 'Uncategorized'}</td>
                <td>
                  {rule.frequency === 'monthly'
                    ? `Monthly (day ${rule.dayOfMonth})`
                    : `Yearly (${months.find(m => m.value === rule.month)?.name}/${rule.dayOfMonth})`}
                </td>
                <td>{new Date(rule.nextRun).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => {
                    setEditingRuleId(rule._id);
                    setForm({
                      title: rule.title, type: rule.type, amount: rule.amount,
                      category: rule.category, frequency: rule.frequency,
                      dayOfMonth: rule.dayOfMonth, month: rule.month, currency: rule.currency || 'USD'
                    });
                  }} title="Edit" className="btn-action">
                    <FiEdit2 style={{ marginRight: '4px' }} /> Edit
                  </button>

                  <button onClick={() => handleDeleteClick(rule._id)} title="Delete" className="btn-action delete-btn">
                    <FiTrash2 style={{ marginRight: '4px' }} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
