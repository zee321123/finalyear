// Import React library for creating the component
import React from 'react';
// Import the CSS file to style the footer
import './footer.css';
// Import Instagram and Telegram icons from react-icons
import { FaInstagram, FaTelegramPlane } from 'react-icons/fa';

// Define the Footer component
const Footer = () => {
  return (
    // Footer container with class "footer" for styling
    <footer className="footer">
      <div className="footer-section left">
        <p>&copy; {new Date().getFullYear()} MoneyTrack</p>
      </div>

      <div className="footer-section center">
        <a href="/support">Help & Support</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </div>

      <div className="footer-section right">
        <span>Follow us:</span>
        <a
          href="https://www.instagram.com/moneytrackofficial?igsh=dW52cXByYTNwdWNi"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <FaInstagram />
        </a>
        <a
          href="https://t.me/moneytrackofficial"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Telegram"
        >
          <FaTelegramPlane />
        </a>
      </div>
    </footer>
  );
};

// Export the Footer component so it can be used in other files
export default Footer;
