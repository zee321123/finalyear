// client/src/components/footer.jsx
import React from 'react';
import './footer.css';
import { FaInstagram, FaTelegramPlane } from 'react-icons/fa';

const Footer = () => {
  return (
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

export default Footer;
