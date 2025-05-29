// Import React and necessary hooks
import React, { useState, useEffect } from 'react';
// Import CSS styles for form layout and design
import './authform.css';

// Load the API base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;


const RegisterForm = () => {
  // Email, password, OTP inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);   // State to control OTP flow
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });   // Toast message (for success/error)
  const [strength, setStrength] = useState('');   // Password strength (Weak / Medium / Strong)
  const [showPassword, setShowPassword] = useState(false);   // Show/hide password toggle

  // Runs whenever password changes
  useEffect(() => {
    const evaluateStrength = (pwd) => {
      if (pwd.length < 6) return 'Weak';
      if (/[A-Z]/.test(pwd) && /\d/.test(pwd) && pwd.length >= 8) return 'Strong';
      return 'Medium';
    };
    setStrength(evaluateStrength(password));
  }, [password]);

  // Show toast and auto-dismiss after 3 seconds
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3000);
  };

  // Send OTP to the entered email
  const handleSendOtp = async () => {
    if (!email) return showToast('error', 'Please enter your email first');

    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
        showToast('success', 'OTP sent to your email');
      } else {
        showToast('error', data.message || 'Failed to send OTP');
      }
    } catch {
      showToast('error', 'Server error sending OTP');
    }
  };

  // Verify OTP entered by user
  const handleVerifyOtp = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsOtpVerified(true);
        showToast('success', 'OTP verified successfully!');
      } else {
        showToast('error', data.message || 'Invalid OTP');
      }
    } catch {
      showToast('error', 'Server error verifying OTP');
    }
  };

  // Submit registration form if OTP verified
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isOtpVerified) return showToast('error', 'Please verify OTP first');

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmail('');
        setPassword('');
        setOtp('');
        setIsOtpSent(false);
        setIsOtpVerified(false);
        showToast('success', data.message || 'Registration successful!');
      } else {
        showToast('error', data.message || 'Registration failed');
      }
    } catch {
      showToast('error', 'An error occurred. Please try again.');
    }
  };

  return (
    <>
      <form className="auth-form" onSubmit={handleRegister}>
        <img src="/logo.png" alt="MoneyTrack Logo" className="auth-logo-large" />

        <p className="form-subtitle">Register to start managing your finances</p>

        <div className="input-wrapper">
          <span className="input-icon">📧</span>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-wrapper password-wrapper">
          <span className="input-icon">🔒</span>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-eye"
            onClick={() => setShowPassword((prev) => !prev)}
            style={{ cursor: 'pointer' }}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </span>
        </div>

        {password && (
          <p className={`password-strength ${strength.toLowerCase()}`}>
            Password Strength: {strength}
          </p>
        )}

        {!isOtpSent ? (
          <button type="button" className="primary-btn" onClick={handleSendOtp}>
            Send OTP
          </button>
        ) : !isOtpVerified ? (
          <>
            <div className="input-wrapper">
              <span className="input-icon">🔢</span>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <button type="button" className="primary-btn" onClick={handleVerifyOtp}>
              Verify OTP
            </button>
          </>
        ) : (
          <button type="submit" className="primary-btn">
            Register
          </button>
        )}
      </form>

      {toast.message && (
        <div className={`custom-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
};

// Export the RegisterForm component for use in other parts of the app
export default RegisterForm;
