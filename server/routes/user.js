const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const User = require('../models/user');

// ✅ Upgrade to Premium Route
router.post('/upgrade-to-premium', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isPremium: true });
    res.json({ message: 'Premium upgrade successful!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upgrade to premium' });
  }
});

module.exports = router;
