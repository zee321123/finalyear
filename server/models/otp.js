const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false } // ✅ added field
}, {
  timestamps: true
});

module.exports = mongoose.model('Otp', otpSchema);
