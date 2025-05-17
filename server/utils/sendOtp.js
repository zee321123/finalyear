const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Google App Password
  }
});

const sendOtp = async (email, otp) => {
  const message = {
    from: `"MoneyTrack" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your MoneyTrack OTP Code',
    html: `<h2>OTP Verification</h2>
           <p>Your OTP is: <strong>${otp}</strong></p>
           <p>It will expire in 5 minutes.</p>`
  };

  await transporter.sendMail(message);
};

module.exports = sendOtp;
