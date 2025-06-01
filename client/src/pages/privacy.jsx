// Import React to define the functional component
import React from 'react';

// Import the CSS file for styling the privacy page
import './privacy.css';

// Define and export the Privacy component
export default function Privacy() {
  return (
    // Main wrapper with consistent spacing and layout styles
    <div className="privacy-container">

      {/* Page title */}
      <h1>Privacy Policy</h1>

      {/* Introduction about the importance of user privacy */}
      <p>
        At MoneyTrack, your privacy is very important to us. This Privacy Policy explains how we collect, use, and protect your personal information.
      </p>

      {/* Section detailing what user data is collected */}
      <h2>Information We Collect</h2>
      <p>We collect your email, name, and other necessary data for account creation and use.</p>

      {/* Section explaining how the collected data is used */}
      <h2>How We Use Information</h2>
      <p>Your data is used strictly to provide services like income and expense tracking. We never sell or share your data with third parties.</p>

      {/* Section describing user rights and options */}
      <h2>Your Choices</h2>
      <p>You can update or delete your account at any time in your settings.</p>

      {/* Contact section for user questions or concerns */}
      <h2>Contact Us</h2>
      <p>If you have any questions about this policy, please reach out via the support page.</p>
    </div>
  );
}
