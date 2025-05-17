const express      = require('express');
const router       = express.Router();
const authenticate = require('../middleware/authenticate');
const multer       = require('multer');
const storage      = multer.memoryStorage();
const upload       = multer({ storage });
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactioncontroller');

// GET /api/transactions
router.get('/', authenticate, getTransactions);

// POST /api/transactions (with optional receipt upload)
router.post(
  '/',
  authenticate,
  upload.single('receipt'),
  createTransaction
);

// PUT /api/transactions/:id (optional edit receipt)
router.put(
  '/:id',
  authenticate,
  upload.single('receipt'),
  updateTransaction
);

// DELETE /api/transactions/:id
router.delete(
  '/:id',
  authenticate,
  deleteTransaction
);

module.exports = router;
