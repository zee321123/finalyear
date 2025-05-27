const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('No token provided.');
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send('Failed to authenticate token.');
    req.user = decoded;
    next();
  });
};

router.post('/', authenticate, async (req, res) => {
  const { type, category, amount, date, description } = req.body;
  try {
    const newTransaction = new Transaction({
      userId: req.user.id,
      type,
      category,
      amount,
      date,
      description,
    });

    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
