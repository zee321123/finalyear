import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import './addtransaction.css';
import { CategoryContext } from '../context/categorycontext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus } from 'react-icons/fa';


const API_URL = 'http://localhost:5000';

const AddTransaction = () => {
  const { categories, fetchCategories } = useContext(CategoryContext);
  const [form, setForm] = useState({
    type: 'expense',
    category: '',
    amount: '',
    date: '',
    description: '',
    currency: 'USD',
  });
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });
  const [receiptFile, setReceiptFile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Loader state

  const currencyOptions = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'INR', symbol: '₹' },
    { code: 'AED', symbol: 'د.إ' },
  ];

  useEffect(() => {
    const loadInitialData = async () => {
      const start = Date.now();
      try {
        await fetchCategories();
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(data);
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      } finally {
        const elapsed = Date.now() - start;
        const delay = Math.max(0, 2000 - elapsed); // ✅ Ensure 2 seconds
        setTimeout(() => setLoading(false), delay);
      }
    };
    loadInitialData();
  }, [fetchCategories]);

  const isAdmin = user?.role === 'admin';

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleNewCategoryChange = e =>
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });

  const handleFileChange = e => setReceiptFile(e.target.files[0]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      let categoryValue = form.category;

      if (useNewCategory) {
        const { data: created } = await axios.post(
          `${API_URL}/api/categories`,
          { name: newCategory.name, type: newCategory.type },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        categoryValue = created._id;
        fetchCategories();
      }

      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('category', categoryValue);
      formData.append('amount', form.amount);
      formData.append('date', form.date);
      formData.append('description', form.description);
      formData.append('currency', form.currency);
      if (receiptFile) formData.append('receipt', receiptFile);

      await axios.post(`${API_URL}/api/transactions`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        params: isAdmin ? { bypassLimit: true } : {}
      });

      toast.success('✅ Transaction added successfully!', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
      });

      setForm({
        type: 'expense',
        category: '',
        amount: '',
        date: '',
        description: '',
        currency: 'USD',
      });
      setNewCategory({ name: '', type: 'expense' });
      setUseNewCategory(false);
      setReceiptFile(null);
    } catch (err) {
      console.error('Error adding transaction:', err);
      if (err.response && err.response.status === 403) {
        toast.error(err.response.data.message || '❌ Limit reached. Upgrade to Premium.', {
          position: 'top-center',
          autoClose: 3000,
          theme: 'colored',
        });
      } else {
        toast.error('❌ Failed to add transaction.', {
          position: 'top-right',
          autoClose: 3000,
          theme: 'colored',
        });
      }
    }
  };

  // ✅ Show loader
  if (loading) {
    return (
      <div className="add-transaction-container loading-state">
        <div className="fancy-loader">
          <div className="dot-group">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="add-transaction-container">
      <h2>Add New Transaction</h2>
      <form className="transaction-form" onSubmit={handleSubmit} encType="multipart/form-data">
        {/* ...same form code... */}
        <label>
          Type:
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>

        <label>
          Category:
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            disabled={useNewCategory}
            required
          >
            <option value="" disabled>Select existing category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </select>
          <div className="new-cat-toggle">
            <input
              type="checkbox"
              id="newCategory"
              checked={useNewCategory}
              onChange={() => setUseNewCategory(prev => !prev)}
            />
            <label htmlFor="newCategory">Create new category</label>
          </div>
        </label>

        {useNewCategory && (
          <>
            <label>
              New Category Name:
              <input
                type="text"
                name="name"
                value={newCategory.name}
                onChange={handleNewCategoryChange}
                placeholder="e.g. Subscription"
                required
              />
            </label>
            <label>
              New Category Type:
              <select
                name="type"
                value={newCategory.type}
                onChange={handleNewCategoryChange}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>
          </>
        )}

        <label>
          Amount:
          <input
            type="number"
            name="amount"
            placeholder="Enter amount"
            value={form.amount}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Date:
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Currency:
          {user && !(user.isPremium || user.role === 'admin') ? (
            <select name="currency" value={form.currency} disabled>
              <option value="USD">$ - USD</option>
            </select>
          ) : (
            <select name="currency" value={form.currency} onChange={handleChange} required>
              {currencyOptions.map(c => (
                <option key={c.code} value={c.code}>
                  {c.symbol} - {c.code}
                </option>
              ))}
            </select>
          )}
        </label>

        <label>
          Description:
          <textarea
            name="description"
            placeholder="Optional"
            value={form.description}
            onChange={handleChange}
          />
        </label>

        <label>
          Attach Receipt (optional):
          <input
            type="file"
            name="receipt"
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={handleFileChange}
          />
          {receiptFile && <p>Selected file: {receiptFile.name}</p>}
        </label>

        <button type="submit" className="add-btn">
  <FaPlus style={{ marginRight: '8px' }} />
  Add Transaction
</button>

      </form>
      <ToastContainer />
    </div>
  );
};

export default AddTransaction;
