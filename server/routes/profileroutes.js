// Import required modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticate = require('../middleware/authenticate');
const User = require('../models/user');

const router = express.Router();

// === Multer Setup to Handle Avatar Uploads ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  // Set filename using user ID
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user.id}${ext}`);
  }
});
const upload = multer({ storage });
const uploadAvatar = upload.single('avatar');

// === GET /api/profile - Fetch User Profile ===
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'fullName businessName avatarUrl email currency role isPremium twoFactorEnabled'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('❌ Profile fetch error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// === POST /api/profile - Update Profile Info & Upload Avatar ===
router.post('/', authenticate, (req, res, next) => {
  uploadAvatar(req, res, (err) => {
    if (err) {
      console.error('❌ Multer upload error:', err);
      return res.status(400).json({ error: 'Failed to upload image' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.fullName = req.body.fullName || user.fullName;
    user.businessName = req.body.businessName || user.businessName;

    // Handle avatar removal
    if (req.body.clearAvatar === 'true') {
      if (user.avatarUrl) {
        const oldPath = path.join(__dirname, '..', user.avatarUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      user.avatarUrl = '';
    }

    // Handle new avatar upload
    if (req.file) {
      const ext = path.extname(req.file.originalname).toLowerCase();
      user.avatarUrl = `/uploads/avatars/${req.user.id}${ext}`;
    }

    await user.save();
    return res.json({
      fullName: user.fullName,
      businessName: user.businessName,
      avatarUrl: user.avatarUrl,
      email: user.email,
      currency: user.currency,
      twoFactorEnabled: user.twoFactorEnabled 
    });
  } catch (err) {
    console.error('❌ Profile update error:', err);
    return res.status(500).json({ error: 'Could not update profile' });
  }
});

// === PUT /api/profile/currency - Update User Currency ===
router.put('/currency', authenticate, async (req, res) => {
  try {
    const { currency } = req.body;
    if (!currency) return res.status(400).json({ error: 'Currency is required' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { currency },
      { new: true }
    );
    return res.json({ message: 'Currency updated', currency: user.currency });
  } catch (err) {
    console.error('❌ Currency update error:', err);
    return res.status(500).json({ error: 'Could not update currency' });
  }
});

// === GET /api/profile/currency - Fetch User Currency ===
router.get('/currency', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('currency');
    return res.json({ currency: user.currency });
  } catch (err) {
    console.error('❌ Currency fetch error:', err);
    return res.status(500).json({ error: 'Could not get currency' });
  }
});

// Export all profile-related routes
module.exports = router;
