// Import mongoose to define the schema
const mongoose = require('mongoose');

// Define the schema for user accounts
const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },   // Hashed password for authentication
  fullName:     { type: String, default: '' },   // Optional full name of the user
  businessName: { type: String, default: '' },
  avatarUrl:    { type: String, default: '' },

  // Premium System
  isPremium: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  //  2FA Fields
  twoFactorEnabled: { type: Boolean, default: false },
  otp: { type: String },
  otpExpires: { type: Date }   // Expiration time for the OTP

}, {
  timestamps: true
});

// Export the User model
module.exports = mongoose.model('User', userSchema);
