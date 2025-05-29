// Import necessary modules
const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token and authenticate user
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];   // Extract token from Authorization header
  if (!token) return res.status(401).send('No token provided.');
  // Verify token using secret key
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send('Failed to authenticate token.');
    req.user = decoded;
    next();
  });
};

// Route: POST /api/transactions
// Adds a new transaction to the database
router.post('/', authenticate, async (req, res) => {
  const { type, category, amount, date, description } = req.body;
  try {
    // Create a new transaction document
    const newTransaction = new Transaction({
      userId: req.user.id,
      type,
      category,
      amount,
      date,
      description,
    });

    // Save the transaction to the database
    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export the router to be used in server.js
module.exports = router;
