const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String },
  amount: { type: Number },
  date: { type: Date },
  description: { type: String },
  currency: { type: String, default: 'USD' }, // ✅ NEW: Currency field
  receipt: {
    data: Buffer,
    contentType: String
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
