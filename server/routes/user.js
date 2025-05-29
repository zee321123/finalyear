// Import required modules
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate'); // Middleware to protect the route
const User = require('../models/user');

// Route to upgrade a user to premium
// POST /api/user/upgrade-to-premium
router.post('/upgrade-to-premium', authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isPremium: true });     // Update the user's record to set isPremium to true
    res.json({ message: 'Premium upgrade successful!' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upgrade to premium' });     // Handle any errors during update
  }
});

// Export the router to use in the main server file
module.exports = router;
