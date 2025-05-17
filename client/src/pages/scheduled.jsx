import './scheduled.css';
import { useState, useEffect, useCallback, useContext } from 'react';
import { FiEdit2, FiTrash2, FiSave, FiXCircle, FiCheckCircle } from 'react-icons/fi';
import { SearchContext } from '../context/searchcontext';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

export default function Scheduled() {
  const [rules, setRules] = useState([]);
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const { searchTerm } = useContext(SearchContext);
  const token = localStorage.getItem('token');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    const start = Date.now();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/scheduled`, {
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
      const delay = Math.max(0, 2000 - elapsed);
      setTimeout(() => setLoading(false), delay);
    }
  }, [token]);

  useEffect(() => {
    fetchRules();

    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(data);
      } catch (err) {
        console.error('❌ Failed to fetch user info:', err);
      }
    };

    fetchUser();
  }, [fetchRules, token]);

  const handleDeleteClick = (id) => {
    setRuleToDelete(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/api/scheduled/${ruleToDelete}`, {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const url = editingRuleId
        ? `${API_URL}/api/scheduled/${editingRuleId}`
        : `${API_URL}/api/scheduled`;
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
      setEditingRuleId(null);
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

  const months = [
    { value: 1, name: 'January' }, { value: 2, name: 'February' }, { value: 3, name: 'March' },
    { value: 4, name: 'April' }, { value: 5, name: 'May' }, { value: 6, name: 'June' },
    { value: 7, name: 'July' }, { value: 8, name: 'August' }, { value: 9, name: 'September' },
    { value: 10, name: 'October' }, { value: 11, name: 'November' }, { value: 12, name: 'December' },
  ];

  const getCurrencySymbol = (code) => ({ USD: '$', EUR: '€', GBP: '£', INR: '₹', AED: 'د.إ' }[code] || code);

  const filteredRules = rules.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="scheduled-container">
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

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="scheduled-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Salary"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="currency">Currency</label>
          {user && !(user.isPremium || user.role === 'admin') ? (
            <select id="currency" value={form.currency} disabled>
              <option value="USD">USD ($)</option>
            </select>
          ) : (
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {["USD", "EUR", "GBP", "INR", "AED"].map(cur => (
                <option key={cur} value={cur}>
                  {cur} ({getCurrencySymbol(cur)})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            type="text"
            placeholder="e.g. Food"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="frequency">Frequency</label>
          <select
            id="frequency"
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dayOfMonth">Day of Month</label>
          <input
            id="dayOfMonth"
            type="number"
            min="1"
            max="31"
            value={form.dayOfMonth}
            onChange={(e) => setForm({ ...form, dayOfMonth: +e.target.value })}
            required
          />
        </div>

        {form.frequency === 'yearly' && (
          <div className="form-group">
            <label htmlFor="month">Month</label>
            <select
              id="month"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: +e.target.value })}
              required
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" className="btn-primary full-width">
          <FiSave style={{ marginRight: '8px' }} />
          {editingRuleId ? 'Update Schedule' : 'Save Schedule'}
        </button>

        {editingRuleId && (
          <button
            type="button"
            onClick={() => {
              setEditingRuleId(null);
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
            }}
            className="btn-secondary full-width"
          >
            <FiXCircle style={{ marginRight: '8px' }} />
            Cancel
          </button>
        )}
      </form>

      <h2 style={{ textAlign: 'left', marginTop: '2rem' }}>Your Scheduled Transactions</h2>

      {filteredRules.length === 0 ? (
        <p>No schedules found.</p>
      ) : (
        <table className="scheduled-table">
          <thead>
            <tr>
              <th>Title</th><th>Type</th><th>Amount</th><th>Category</th><th>Frequency</th><th>Next Run</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule) => (
              <tr key={rule._id}>
                <td>{rule.title}</td>
                <td>{rule.type}</td>
                <td>{getCurrencySymbol(rule.currency || 'USD')}{parseFloat(rule.amount).toFixed(2)}</td>
                <td>{rule.category || 'Uncategorized'}</td>
                <td>{rule.frequency === 'monthly' ? `Monthly (day ${rule.dayOfMonth})` : `Yearly (${months.find(m => m.value === rule.month)?.name}/${rule.dayOfMonth})`}</td>
                <td>{new Date(rule.nextRun).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => {
                      setEditingRuleId(rule._id);
                      setForm({
                        title: rule.title,
                        type: rule.type,
                        amount: rule.amount,
                        category: rule.category,
                        frequency: rule.frequency,
                        dayOfMonth: rule.dayOfMonth,
                        month: rule.month,
                        currency: rule.currency || 'USD',
                      });
                    }}
                    title="Edit"
                    className="btn-action"
                  >
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
