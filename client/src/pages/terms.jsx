// Import React and the CSS file for styling
import React from 'react';
import './terms.css';

// Terms & Conditions component
export default function Terms() {
  return (
    // Container with consistent styling for the terms page
    <div className="terms-container">
      {/* Page title */}
      <h1>Terms & Conditions</h1>

      {/* Introductory paragraph */}
      <p>
        Welcome to MoneyTrack. By accessing or using our website and services, you agree to be bound by these terms and conditions. Please read them carefully.
      </p>

      {/* Section 1: Use of services */}
      <h2>1. Use of Our Services</h2>
      <p>
        You agree to use MoneyTrack only for lawful purposes. You must not use our platform to distribute any harmful, misleading, or illegal content or to attempt unauthorized access to any system.
      </p>

      {/* Section 2: Account responsibilities */}
      <h2>2. Account Responsibilities</h2>
      <p>
        When you register for an account, you are responsible for keeping your login credentials secure. You are also responsible for all activity that occurs under your account.
      </p>

      {/* Section 3: Privacy link */}
      <h2>3. Privacy</h2>
      <p>
        Your use of our services is also governed by our <a href="/privacy">Privacy Policy</a>, which explains how we collect and protect your personal data.
      </p>

      {/* Section 4: Intellectual property */}
      <h2>4. Intellectual Property</h2>
      <p>
        All content, trademarks, logos, and software on MoneyTrack are the property of MoneyTrack or its licensors and are protected by intellectual property laws.
      </p>

      {/* Section 5: Limitation of liability */}
      <h2>5. Limitation of Liability</h2>
      <p>
        We are not liable for any direct, indirect, or incidental damages resulting from your use of our services. We do not guarantee that the platform will be error-free or always available.
      </p>

      {/* Section 6: Termination clause */}
      <h2>6. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your access to the platform at any time, without notice, if we believe you have violated these terms.
      </p>

      {/* Section 7: Updates to terms */}
      <h2>7. Changes to Terms</h2>
      <p>
        We may update these terms from time to time. We will notify users of any significant changes. Continued use of the platform means you accept the new terms.
      </p>

      {/* Section 8: Contact information */}
      <h2>8. Contact Us</h2>
      <p>
        If you have any questions about these Terms & Conditions, please contact us at <a href="mailto:moneytrackapp01@gmail.com">moneytrackapp01@gmail.com</a>
      </p>
    </div>
  );
}
