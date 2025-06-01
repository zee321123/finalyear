import React from 'react';
import './upgrade.css';

// Import icons for visual representation of each feature
import {
  FaInfinity,
  FaFileExport,
  FaListUl,
  FaCalendarAlt,
  FaGlobe,
  FaLock,
  FaCrown, // Premium crown icon for the Buy button
} from 'react-icons/fa';

import { loadStripe } from '@stripe/stripe-js';

// Get your backend API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL;

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

// Upgrade component to display premium features and handle payments
export default function Upgrade() {
  // Function to handle premium purchase with Stripe Checkout
  const handleBuyPremium = async () => {
    try {
      // Send request to backend to create Stripe checkout session
      const res = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      const stripe = await stripePromise;

      // Redirect user to Stripe checkout page
      if (data.url) {
        const sessionId = new URL(data.url).searchParams.get('session_id');
        if (sessionId) {
          stripe.redirectToCheckout({ sessionId });
        } else {
          window.location.href = data.url; // fallback if no session ID
        }
      } else {
        alert('Something went wrong with payment setup.');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      alert('Payment failed. Try again.');
    }
  };

  return (
    <div className="upgrade-page">
      <h1 className="upgrade-title">Unlock Premium 🚀</h1>

      {/* Grid of premium features with icons and descriptions */}
      <div className="features-list">
        <div className="feature-card">
          <FaInfinity className="feature-icon" />
          <h3>Unlimited Transactions</h3>
          <p>Track endless income and expense entries without restrictions.</p>
        </div>
        <div className="feature-card">
          <FaFileExport className="feature-icon" />
          <h3>Unlimited Exports</h3>
          <p>Download your data anytime as PDF or CSV files.</p>
        </div>
        <div className="feature-card">
          <FaListUl className="feature-icon" />
          <h3>Unlimited Categories</h3>
          <p>Create and manage unlimited custom categories.</p>
        </div>
        <div className="feature-card">
          <FaCalendarAlt className="feature-icon" />
          <h3>Unlimited Scheduled Transactions</h3>
          <p>Set up unlimited recurring payments or deposits.</p>
        </div>
        <div className="feature-card">
          <FaGlobe className="feature-icon" />
          <h3>Multi-Currency Support</h3>
          <p>Choose your preferred currency from multiple options.</p>
        </div>
        <div className="feature-card">
          <FaLock className="feature-icon" />
          <h3>2-Factor Authentication</h3>
          <p>Secure your account with a verification code at login. Extra protection, only for premium users.</p>
        </div>
      </div>

      {/* Buy Premium button with crown icon */}
      <button className="buy-button" onClick={handleBuyPremium}>
        <FaCrown className="premium-icon" />
        Buy Premium - $10.00/month
      </button>
    </div>
  );
}
