// Import nodemailer for sending emails
const nodemailer = require('nodemailer');

// Create a transporter using Gmail and app-specific credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address (from .env)
    pass: process.env.EMAIL_PASS  // App-specific password (not your actual Gmail password)
  }
});

/**
 * Sends a One-Time Password (OTP) to the specified email address.
 * @param {string} email - Recipient's email address
 * @param {string} otp - The OTP code to send
 */
const sendOtp = async (email, otp) => {
  // Construct the email message
  const message = {
    from: `"MoneyTrack" <${process.env.EMAIL_USER}>`, // Sender info
    to: email, // Receiver's email
    subject: 'Your MoneyTrack OTP Code', // Email subject
    html: `<h2>OTP Verification</h2>
           <p>Your OTP is: <strong>${otp}</strong></p>
           <p>It will expire in 5 minutes.</p>` // Email body (HTML)
  };

  // Send the email
  await transporter.sendMail(message);
};

// Export the function so it can be used elsewhere
module.exports = sendOtp;
