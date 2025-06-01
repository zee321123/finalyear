// Import required React hooks and icons
import React, { useState } from 'react';
import './support.css';
import { FaInstagram, FaTelegramPlane, FaChevronDown, FaChevronUp } from 'react-icons/fa';

// List of FAQs with questions and answers
const faqs = [
  {
    question: 'How do I add a transaction?',
    answer: 'Go to the Add Transaction page and fill in the form with the necessary details like amount, category, and date.',
  },
  {
    question: 'How do I categorize my expenses?',
    answer: 'Use the addtransaction page to create categories and use categories page to view,delete or export a category.',
  },
  {
    question: 'What is Premium?',
    answer: 'Premium unlocks advanced features such as unlimited reports, CSV/PDF exports, and 2FA Login.',
  },
];

// Functional component for Support page
export default function Support() {
  const [openIndex, setOpenIndex] = useState(null); // Track which FAQ is open

  // Toggle function for FAQ accordion
  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index); // Collapse if already open
  };

  return (
    <div className="support-page">
      <h1>Help & Support</h1>
      <p>If you have any questions, issues, or need help using MoneyTrack, you're in the right place.</p>

      {/* FAQ Section */}
      <section>
        <h2>Frequently Asked Questions</h2>
        <div className="faq-container">
          {faqs.map((item, index) => (
            <div
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
              key={index}
              onClick={() => toggleFAQ(index)}
            >
              <div className="faq-question">
                {item.question}
                <span className="faq-icon">
                  {openIndex === index ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </div>
              {/* Show answer if this FAQ is open */}
              {openIndex === index && <div className="faq-answer">{item.answer}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Contact support section */}
      <section>
        <h2>Contact Support</h2>
        <p>Email us at <a href="mailto:moneytrackapp01@gmail.com">moneytrackapp01@gmail.com</a> for assistance.</p>
      </section>

      {/* Social media links */}
      <section className="social-links">
        <h2>Follow Us On</h2>
        <div className="icons">
          <a
            href="https://www.instagram.com/moneytrackofficial?igsh=dW52cXByYTNwdWNi"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram className="icon instagram" />
          </a>
          <a
            href="https://t.me/moneytrackofficial"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
          >
            <FaTelegramPlane className="icon telegram" />
          </a>
        </div>
      </section>
    </div>
  );
}
