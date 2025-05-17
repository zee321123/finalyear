const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  fullName:     { type: String, default: '' },
  businessName: { type: String, default: '' },
  avatarUrl:    { type: String, default: '' },

  // 🚀 Premium System
  isPremium: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // 🔐 2FA Fields
  twoFactorEnabled: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date }

}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
