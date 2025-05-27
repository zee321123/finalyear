const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const ExportLog = require('../models/exportlog');
const Transaction = require('../models/transaction');
const Category = require('../models/category'); // ✅ Added for category lookup
const authenticate = require('../middleware/authenticate');
const { generateCSV, generatePDF } = require('../utils/exportGenerator');

const FREE_LIMIT = 5;

// ✅ Helper: Check if user is free-tier
function isFreeUser(user) {
  return !user.isPremium && user.role !== 'admin';
}

// ✅ 1. Check export limit
router.post('/check', authenticate, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (!isFreeUser(req.user)) {
      return res.json({ allowed: true });
    }

    const count = await ExportLog.countDocuments({ userId });
    if (count >= FREE_LIMIT) {
      return res.status(403).json({ allowed: false });
    }

    return res.json({ allowed: true });
  } catch (err) {
    console.error('❌ [CHECK] Export check failed:', err);
    return res.status(500).json({ allowed: false });
  }
});

// ✅ 2. Export CSV
router.post('/csv', authenticate, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (isFreeUser(req.user)) {
      const count = await ExportLog.countDocuments({ userId });
      if (count >= FREE_LIMIT) {
        return res.status(403).json({ message: 'CSV export limit reached' });
      }
    }

    let transactions = await Transaction.find({ userId });

    // 🔁 Convert category IDs to names (if needed)
    transactions = await Promise.all(
      transactions.map(async (txn) => {
        if (/^[0-9a-fA-F]{24}$/.test(txn.category)) {
          const cat = await Category.findById(txn.category);
          if (cat) txn.category = cat.name;
        }
        return txn;
      })
    );

    const csvBuffer = generateCSV(transactions);

    if (isFreeUser(req.user)) {
      await ExportLog.create({ userId, type: 'csv' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csvBuffer);
  } catch (err) {
    console.error('❌ [CSV] Export error:', err);
    res.status(500).json({ message: 'Failed to export CSV' });
  }
});

// ✅ 3. Export PDF
router.post('/pdf', authenticate, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (isFreeUser(req.user)) {
      const count = await ExportLog.countDocuments({ userId });
      if (count >= FREE_LIMIT) {
        return res.status(403).json({ message: 'PDF export limit reached' });
      }
    }

    let transactions = await Transaction.find({ userId });

    // 🔁 Convert category IDs to names (if needed)
    transactions = await Promise.all(
      transactions.map(async (txn) => {
        if (/^[0-9a-fA-F]{24}$/.test(txn.category)) {
          const cat = await Category.findById(txn.category);
          if (cat) txn.category = cat.name;
        }
        return txn;
      })
    );

    const pdfBuffer = generatePDF(transactions);

    if (!pdfBuffer || pdfBuffer.length < 100) {
      return res.status(500).json({ message: 'PDF generation failed' });
    }

    if (isFreeUser(req.user)) {
      await ExportLog.create({ userId, type: 'pdf' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.pdf"');
    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.error('❌ [PDF] Export route failed:', err);
    res.status(500).json({ message: 'Failed to export PDF' });
  }
});

// ✅ 4. Log per-category exports
router.post('/log', authenticate, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { type } = req.body;

    if (!['csv', 'pdf'].includes(type)) {
      return res.status(400).json({ message: 'Invalid export type' });
    }

    if (isFreeUser(req.user)) {
      const count = await ExportLog.countDocuments({ userId });
      if (count >= FREE_LIMIT) {
        return res.status(403).json({ message: 'Export limit reached' });
      }

      await ExportLog.create({ userId, type });
    }

    res.status(201).json({ message: 'Export logged' });
  } catch (err) {
    console.error('❌ [LOG] Failed:', err);
    res.status(500).json({ message: 'Failed to log export' });
  }
});

module.exports = router;
