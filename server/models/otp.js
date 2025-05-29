// Import Mongoose to define schema and interact with MongoDB
const mongoose = require('mongoose');

// Define the schema for storing OTP (One-Time Password) details
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false } 
}, {
  timestamps: true   // Automatically add createdAt and updatedAt fields
});

// Export the model so it can be used in other parts of the app
module.exports = mongoose.model('Otp', otpSchema);
