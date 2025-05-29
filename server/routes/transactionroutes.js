// Import required modules
const express      = require('express');
const router       = express.Router();
const authenticate = require('../middleware/authenticate');
const multer       = require('multer'); // Multer setup to store uploaded files in memory (useful for uploading receipts)
const storage      = multer.memoryStorage();
const upload       = multer({ storage });
// Import controller functions for transaction handling
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

// Delete a transaction by ID
// DELETE /api/transactions/:id
router.delete(
  '/:id',
  authenticate,
  deleteTransaction
);
// Export the router so it can be used in the main app
module.exports = router;
