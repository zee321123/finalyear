const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const Category = require('../models/category'); // ✅ Import Category model
const jwt = require('jsonwebtoken');

// ✅ Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('No token provided.');
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send('Failed to authenticate token.');
    req.user = decoded;
    next();
  });
};

// ✅ POST /transactions - Save category name instead of ID
router.post('/', authenticate, async (req, res) => {
  const { type, category, amount, date, description, currency } = req.body;

  try {
    // 🟢 Get the category name using its ID
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    const newTransaction = new Transaction({
      userId: req.user.id,
      type,
      category: categoryDoc.name, // ✅ Save category name
      amount,
      date,
      description,
      currency,
    });

    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
