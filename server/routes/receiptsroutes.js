// server/routes/receiptsroutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authenticate = require('../middleware/authenticate');
const Transaction = require('../models/transaction');

// GET /api/receipts
// Fetch metadata of all uploaded receipts for the logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const receipts = await Transaction
      .find({ userId, 'receipt.data': { $exists: true } })
      .select('_id category date');
    // Map to { id, category, date }
    const result = receipts.map(r => ({ id: r._id, category: r.category, date: r.date }));
    res.json(result);
  } catch (err) {
    console.error('GetReceipts error:', err);
    res.status(500).json({ message: 'Failed to load receipts', error: err.message });
  }
});

// GET /api/receipts/:id
// Fetch the actual receipt file by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid receipt ID' });
    }
    const tx = await Transaction.findById(id);
    if (!tx || tx.userId.toString() !== req.user.id || !tx.receipt?.data) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    // Set the appropriate content type and return the file data
    res.contentType(tx.receipt.contentType);
    res.send(tx.receipt.data);
  } catch (err) {
    console.error('GetReceiptFile error:', err);
    res.status(500).json({ message: 'Failed to retrieve receipt', error: err.message });
  }
});

module.exports = router;

