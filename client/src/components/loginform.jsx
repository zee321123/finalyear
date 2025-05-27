import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/usercontext';
import './authform.css';

const API_URL = import.meta.env.VITE_API_URL;


const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [is2FA, setIs2FA] = useState(false);
  const [loginUserId, setLoginUserId] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false); // 👁️ Eye toggle state

  const navigate = useNavigate();
  const { setProfile } = useContext(UserContext);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3000);
  };

  const handleSendOtp = async () => {
    if (!email) return showToast('error', 'Enter your email first');
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
      showToast('error', 'Server error while sending OTP');
    }
  };

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
        showToast('success', 'OTP verified!');
      } else {
        showToast('error', data.message || 'Invalid OTP');
      }
    } catch {
      showToast('error', 'Server error verifying OTP');
    }
  };

  const finalizeLogin = async (token) => {
    localStorage.setItem('token', token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role || '';
    localStorage.setItem('role', role);
    const isPremium = role === 'admin' ? true : payload.isPremium;
    localStorage.setItem('isPremium', isPremium ? 'true' : 'false');

    const profileRes = await fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profile = await profileRes.json();

    setProfile({
      avatarUrl: profile.avatarUrl || '',
      fullName: profile.fullName || '',
    });

    setEmail('');
    setPassword('');
    showToast('success', 'Login successful!');
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.requiresOtp) {
        setIs2FA(true);
        setLoginUserId(data.userId);
        showToast('info', 'OTP sent to your email');
      } else if (response.ok && data.token) {
        finalizeLogin(data.token);
      } else {
        showToast('error', 'Login unsuccessful: ' + (data.message || 'Please try again.'));
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      showToast('error', 'An error occurred. Please try again.');
    }
  };

  const handleVerifyLoginOtp = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loginUserId, otp }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setIs2FA(false);
        setLoginUserId('');
        finalizeLogin(data.token);
      } else {
        showToast('error', data.message || 'Invalid or expired OTP');
      }
    } catch (err) {
      console.error('❌ OTP verify error:', err);
      showToast('error', 'An error occurred. Please try again.');
    }
  };

 const handleResetPassword = async (e) => {
  e.preventDefault();

  if (newPassword !== confirmPassword) {
    return showToast('error', 'Passwords do not match');
  }

  if (newPassword.length < 6) {
    return showToast('error', 'Password must be at least 6 characters');
  }

  if (!isOtpVerified) {
    return showToast('error', 'Verify OTP first');
  }

  try {
    const res = await fetch(`${API_URL}/auth/otp-reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        code: otp, // ✅ send OTP
        newPassword
      }),
    });

    const data = await res.json();
    if (res.ok) {
      showToast('success', 'Password updated successfully!');
      setForgotMode(false);
      setIsOtpSent(false);
      setIsOtpVerified(false);
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
    } else {
      showToast('error', data.message || 'Reset failed');
    }
  } catch {
    showToast('error', 'Server error. Try again later.');
  }
};


  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <>
      <form className="auth-form" onSubmit={forgotMode ? handleResetPassword : handleLogin}>
        <img src="/logo.png" alt="MoneyTrack Logo" className="auth-logo-large" />

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

        {!forgotMode && !is2FA && (
          <div className="input-wrapper password-wrapper">
            <span className="input-icon">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
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
        )}

        {is2FA && (
          <>
            <div className="input-wrapper">
              <span className="input-icon">🔢</span>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button type="button" className="primary-btn" onClick={handleVerifyLoginOtp}>
              Verify OTP & Login
            </button>
          </>
        )}

        {forgotMode && (
          <>
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
              <>
                <div className="input-wrapper">
                  <span className="input-icon">🔑</span>
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="input-wrapper">
                  <span className="input-icon">✅</span>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
          </>
        )}

        {!is2FA && (
          <button type="submit" className="primary-btn">
            {forgotMode ? 'Reset Password' : 'Login'}
          </button>
        )}

        {!forgotMode && !is2FA && (
          <>
            <div className="divider">or</div>
            <button type="button" className="google-btn" onClick={handleGoogleLogin}>
              <img src="/google-icon.png" alt="Google" className="google-icon" />
              Continue with Google
            </button>
          </>
        )}

        <div className="extra-links">
          <button
            type="button"
            className="back-link"
            onClick={() => {
              setForgotMode((prev) => !prev);
              setIsOtpSent(false);
              setIsOtpVerified(false);
              setIs2FA(false);
              setOtp('');
              setNewPassword('');
              setConfirmPassword('');
            }}
          >
            {forgotMode ? '← Back to Login' : 'Forgot Password?'}
          </button>
        </div>
      </form>

      {toast.message && (
        <div className={`custom-toast ${toast.type}`}>
          <span style={{ marginRight: '10px', fontSize: '18px' }}>
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          {toast.message}
        </div>
      )}
    </>
  );
};

export default LoginForm;
