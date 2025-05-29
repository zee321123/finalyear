// Import mongoose to define the schema
const mongoose = require('mongoose');

// Define the schema for storing individual transactions
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String },
  amount: { type: Number },
  date: { type: Date },
  description: { type: String },
  currency: { type: String, default: 'USD' }, 
  // Optional receipt file stored as binary data 
  receipt: {
    data: Buffer,
    contentType: String
  }
});

// Export the model so it can be used in controllers/routes
module.exports = mongoose.model('Transaction', transactionSchema);
