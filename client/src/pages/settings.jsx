// Import React dependencies and necessary hooks
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Import user context and styles
import { UserContext } from '../context/usercontext';
import './settings.css';

// Import icons for buttons and feedback
import { FaSave, FaSignOutAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

// Load environment variable for API base URL
const API_URL = import.meta.env.VITE_API_URL;

// Settings component
export default function Settings() {
  const navigate = useNavigate();
  const { setProfile: setGlobalProfile, resetProfile } = useContext(UserContext);

  // State for user profile and other UI states
  const [profile, setProfile] = useState({
    fullName: '',
    businessName: '',
    avatarUrl: '',
    email: '',
    twoFactorEnabled: false,
    isPremium: false
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch user profile data on component mount
  useEffect(() => {
    const start = Date.now();
    const token = localStorage.getItem('token');

    fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setProfile({
          fullName: data.fullName || '',
          businessName: data.businessName || '',
          avatarUrl: data.avatarUrl || '',
          email: data.email || '',
          twoFactorEnabled: data.twoFactorEnabled || false,
          isPremium: data.isPremium || false
        });
      })
      .catch(err => console.error('Failed to load profile', err))
      .finally(() => {
        const elapsed = Date.now() - start;
        const delay = Math.max(0, 2000 - elapsed);
        setTimeout(() => setLoading(false), delay);
      });
  }, []);

  // Submit profile updates
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const formData = new FormData();

    formData.append('fullName', profile.fullName);
    formData.append('businessName', profile.businessName);

    if (avatarFile) {
      formData.append('avatar', avatarFile);
    } else if (!profile.avatarUrl) {
      formData.append('clearAvatar', 'true');
    }

    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const updated = await res.json();

      if (res.ok) {
        const newProfile = {
          fullName: updated.fullName || '',
          businessName: updated.businessName || '',
          avatarUrl: updated.avatarUrl || '',
          email: updated.email || '',
          twoFactorEnabled: updated.twoFactorEnabled || false,
          isPremium: updated.isPremium || false
        };

        setProfile(newProfile);
        setGlobalProfile(newProfile);
        setAvatarFile(null);
        setMessage('✅ Profile updated successfully!');
      } else {
        setMessage(updated.error || '❌ Failed to update profile.');
      }
    } catch (err) {
      console.error('❌ Update error:', err);
      setMessage('❌ Network error while updating profile.');
    }
  };

  // Handle avatar removal
  const handleDeleteAvatar = async () => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('fullName', profile.fullName);
    formData.append('businessName', profile.businessName);
    formData.append('clearAvatar', 'true');

    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const updated = await res.json();

      if (res.ok) {
        setProfile(prev => {
          const newProfile = { ...prev, avatarUrl: updated.avatarUrl || '' };
          setGlobalProfile(newProfile);
          return newProfile;
        });
        setAvatarFile(null);
        setMessage('🗑️ Avatar removed');
      }
    } catch (err) {
      console.error('Delete avatar failed', err);
    }
  };

  // Handle logout confirmation
  const handleLogout = () => {
    localStorage.removeItem('token');
    resetProfile();
    navigate('/', { replace: true });
  };

  // Toggle 2FA setting
  const handleToggle2FA = async () => {
    if (!profile.isPremium) {
      return setMessage('🔒 2FA is only available for premium users.');
    }

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_URL}/auth/toggle-2fa`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setProfile(prev => ({
          ...prev,
          twoFactorEnabled: data.twoFactorEnabled,
        }));
        setMessage(`🔐 2FA ${data.twoFactorEnabled ? 'enabled' : 'disabled'} successfully.`);
      } else {
        setMessage(data.message || '❌ Failed to toggle 2FA.');
      }
    } catch (err) {
      console.error('❌ Toggle 2FA error:', err);
      setMessage('❌ Network error while toggling 2FA.');
    }
  };

  // Show loading spinner while fetching profile
  if (loading) {
    return (
      <div className="settings-container loading-state">
        <div className="fancy-loader">
          <div className="dot-group">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
          <p>Loading Settings...</p>
        </div>
      </div>
    );
  }

  // Main settings form layout
  return (
    <div className="settings-container">
      <h1>Profile Settings</h1>

      {message && <div className="settings-notice">{message}</div>}

      {/* Avatar section */}
      <div className="avatar-section">
        <div className="avatar-wrapper" onClick={() => fileInputRef.current.click()}>
          {avatarFile ? (
            <img src={URL.createObjectURL(avatarFile)} alt="Avatar preview" className="avatar-img" />
          ) : profile.avatarUrl ? (
            <img src={`${API_URL}${profile.avatarUrl}`} alt="Avatar" className="avatar-img" />
          ) : (
            <div className="avatar-placeholder">📷</div>
          )}
        </div>

        {(profile.avatarUrl || avatarFile) && (
          <button type="button" className="avatar-delete" onClick={handleDeleteAvatar}>×</button>
        )}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="avatar-input"
          onChange={(e) => setAvatarFile(e.target.files[0])}
        />
      </div>

      {/* User profile update form */}
      <form className="settings-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={profile.email} readOnly />
        </label>

        <label>
          Your Name
          <input
            type="text"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
            required
          />
        </label>

        <label>
          Business Name
          <input
            type="text"
            value={profile.businessName}
            onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
            required
          />
        </label>

        {/* 2FA toggle for premium users */}
        <div className="toggle-row">
          <label htmlFor="2fa-toggle" className="toggle-label">
            2-Factor Authentication (OTP on Login)
            {!profile.isPremium && (
              <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '8px' }}>
                (Premium only 🔒)
              </span>
            )}
          </label>
          <label className="switch">
            <input
              id="2fa-toggle"
              type="checkbox"
              checked={profile.twoFactorEnabled}
              onChange={handleToggle2FA}
              disabled={!profile.isPremium}
            />
            <span className="slider round"></span>
          </label>
        </div>

        {/* Submit and logout buttons */}
        <button type="submit" className="btn-save">
          <FaSave style={{ marginRight: '8px' }} />
          Save Changes
        </button>

        <button type="button" className="btn-logout" onClick={() => setShowConfirmLogout(true)}>
          <FaSignOutAlt style={{ marginRight: '8px' }} />
          Logout
        </button>
      </form>

      {/* Logout confirmation popup */}
      {showConfirmLogout && (
        <div className="confirm-popup">
          <div className="confirm-box">
            <p>Are you sure you want to logout?</p>
            <div className="confirm-buttons">
              <button className="confirm-yes" onClick={handleLogout}>
                <FaCheckCircle style={{ marginRight: '6px' }} />
                Yes
              </button>
              <button className="confirm-no" onClick={() => setShowConfirmLogout(false)}>
                <FaTimesCircle style={{ marginRight: '6px' }} />
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
