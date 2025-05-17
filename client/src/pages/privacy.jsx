// client/src/pages/privacy.jsx
import React from 'react';
import './privacy.css'; // optional: create for custom styles

export default function Privacy() {
  return (
    <div className="privacy-container">
      <h1>Privacy Policy</h1>
      <p>
        At MoneyTrack, your privacy is very important to us. This Privacy Policy explains how we collect, use, and protect your personal information.
      </p>

      <h2>Information We Collect</h2>
      <p>We collect your email, name, and other necessary data for account creation and use.</p>

      <h2>How We Use Information</h2>
      <p>Your data is used strictly to provide services like income and expense tracking. We never sell or share your data with third parties.</p>

      <h2>Your Choices</h2>
      <p>You can update or delete your account at any time in your settings.</p>

      <h2>Contact Us</h2>
      <p>If you have any questions about this policy, please reach out via the support page.</p>
    </div>
  );
}
