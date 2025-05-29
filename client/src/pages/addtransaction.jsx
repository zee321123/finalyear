// Import necessary libraries and components
import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import './addtransaction.css';
import { CategoryContext } from '../context/categorycontext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus } from 'react-icons/fa';

// Get backend API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;

// Main AddTransaction component
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
    // State for handling new category creation
  const [useNewCategory, setUseNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' });
  const [receiptFile, setReceiptFile] = useState(null);   // File input state
  const [user, setUser] = useState(null);   // Store user info to check premium/admin status
  const [loading, setLoading] = useState(true);   // Loading state for initial data

  // Currency options for the dropdown
  const currencyOptions = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'INR', symbol: '₹' },
    { code: 'AED', symbol: 'د.إ' },
  ];

  // Fetch categories and user profile when component mounts
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
        const delay = Math.max(0, 2000 - elapsed); 
        setTimeout(() => setLoading(false), delay);
      }
    };
    loadInitialData();
  }, [fetchCategories]);

  // Determine if user is admin
  const isAdmin = user?.role === 'admin';

  // Handle input changes for the main form
  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Handle input changes for new category creation
  const handleNewCategoryChange = e =>
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });

  // Handle receipt file upload
  const handleFileChange = e => setReceiptFile(e.target.files[0]);

  // Handle form submission to add a transaction
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

       // Prepare form data including optional file upload
      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('category', categoryValue);
      formData.append('amount', form.amount);
      formData.append('date', form.date);
      formData.append('description', form.description);
      formData.append('currency', form.currency);
      if (receiptFile) formData.append('receipt', receiptFile);

      // Send transaction data to backend
      await axios.post(`${API_URL}/api/transactions`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        params: isAdmin ? { bypassLimit: true } : {}
      });
      // Show success toast
      toast.success('✅ Transaction added successfully!', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'colored',
      });

       // Reset form and states
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
      // Handle error and show appropriate toast
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

  // Display loading spinner if data is not ready
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

  // Main form rendering
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
// Export the component
export default AddTransaction;
