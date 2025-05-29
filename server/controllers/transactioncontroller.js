// Import Mongoose and Transaction model
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');

// Helper function to check if user is on free plan (not premium and not admin)
const isFreeUser = (user) => !user.isPremium && user.role !== 'admin';

// ====================== GET TRANSACTIONS ======================
exports.getTransactions = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const txns = await Transaction.find({ userId }).sort({ date: -1 });
    return res.json(txns);
  } catch (err) {
    console.error('❌ GetTxns error:', err);
    return res.status(500).json({ message: 'Failed to load transactions', error: err.message });
  }
};

// ====================== CREATE TRANSACTION ======================
exports.createTransaction = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { type, category, amount, date, description, currency } = req.body;

    if (isFreeUser(req.user)) {
      const txnCount = await Transaction.countDocuments({ userId });
      if (txnCount >= 5) {
        return res.status(403).json({
          message: 'Free plan limit reached. Upgrade to Premium to add more transactions.'
        });
      }
    }

    // Build the transaction data object
    const txData = {
      userId,
      type,
      category,
      amount,
      date,
      description,
      currency,
    };

    if (req.file) {
      txData.receipt = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    // Create and return the new transaction
    const newTx = await Transaction.create(txData);
    return res.status(201).json(newTx);
  } catch (err) {
    console.error('❌ CreateTxn error:', err);
    return res.status(500).json({ message: 'Failed to create transaction', error: err.message });
  }
};

// ====================== UPDATE TRANSACTION ======================
exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const tx = await Transaction.findById(id);
    if (!tx || tx.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const { type, category, amount, date, description, currency } = req.body;

    // Update fields if provided
    if (type) tx.type = type;
    if (category) tx.category = category;
    if (amount) tx.amount = amount;
    if (date) tx.date = date;
    if (description) tx.description = description;
    if (currency) tx.currency = currency;

    if (req.file) {
      tx.receipt = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    // Save and return the updated transaction
    const updatedTx = await tx.save();
    return res.json(updatedTx);
  } catch (err) {
    console.error('❌ UpdateTxn error:', err);
    return res.status(500).json({ message: 'Failed to update transaction', error: err.message });
  }
};

// ====================== DELETE TRANSACTION ======================
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate transaction ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid transaction ID' });
    }

    const tx = await Transaction.findById(id);
    if (!tx || tx.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Delete the transaction
    await Transaction.findByIdAndDelete(id);
    return res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('❌ DeleteTxn error:', err);
    return res.status(500).json({ message: 'Failed to delete transaction', error: err.message });
  }
};
