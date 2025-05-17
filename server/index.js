// ✅ All your existing imports
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('passport');
const cron = require('node-cron');
const dayjs = require('dayjs');
const path = require('path');
const User = require('./models/user');
const Otp = require('./models/otp');
const sendOtp = require('./utils/sendOtp');
const Transaction = require('./models/transaction');
const ScheduledTransaction = require('./models/scheduledtransaction');
const authenticate = require('./middleware/authenticate'); // ✅ Added correctly

require('./passport');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'secretkey';

// ✅ Webhook first
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// ✅ Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'sessionSecret123',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Your existing routes below (unchanged except now authenticate works)
// Send OTP
app.post('/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await Otp.deleteMany({ email });
  await Otp.create({ email, code, expiresAt });

  try {
    await sendOtp(email, code);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// ✅ Verify OTP (used for password reset etc.)
app.post('/auth/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  const record = await Otp.findOne({ email, code });

  if (!record) return res.status(400).json({ message: 'Invalid OTP' });
  if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

  await Otp.deleteMany({ email });
  res.json({ message: 'OTP verified' });
});

// ✅ Register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const isAdmin = email === 'admin@moneytrack.com';

    const newUser = await User.create({
      email,
      password: hashed,
      role: isAdmin ? 'admin' : 'user',
      isPremium: isAdmin
    });

    res.status(201).json({
      message: 'User registered',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        isPremium: newUser.isPremium
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Login with 2FA support
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (email === 'admin@moneytrack.com' && user.role !== 'admin') {
      user.role = 'admin';
      user.isPremium = true;
      await user.save();
    }

    if (user.twoFactorEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      await sendOtp(user.email, otp);

      return res.json({
        requiresOtp: true,
        userId: user._id,
        message: '2FA enabled: OTP sent to your email'
      });
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });
    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      isPremium: user.isPremium
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Verify OTP for login
app.post('/auth/verify-login-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);

    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, SECRET, { expiresIn: '1d' });
    res.json({
      message: 'Login successful via OTP',
      token,
      role: user.role,
      isPremium: user.isPremium
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Toggle 2FA (with authenticate middleware)
app.put('/auth/toggle-2fa', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.isPremium) {
      return res.status(403).json({ message: '2FA is only available for premium users.' });
    }

    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();

    res.json({ success: true, twoFactorEnabled: user.twoFactorEnabled });
  } catch (err) {
    console.error('2FA toggle error:', err);
    res.status(500).json({ message: 'Server error while toggling 2FA' });
  }
});

// ✅ Manual password reset
app.post('/auth/reset-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ✅ OTP-based password reset
app.post('/auth/otp-reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.json({ message: 'Password updated successfully (via OTP)' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Google OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id, email: req.user.email }, SECRET, { expiresIn: '1d' });
    res.redirect(`http://localhost:5173/dashboard?token=${encodeURIComponent(token)}`);
  }
);

// ✅ Routes
app.use('/api/reports', require('./routes/reportroutes'));
app.use('/api/transactions', require('./routes/transactionroutes'));
app.use('/api/receipts', require('./routes/receiptsroutes'));
app.use('/api/profile', authenticate, require('./routes/profileroutes'));
app.use('/api/categories', require('./routes/categoriesroutes'));
app.use('/api/user', require('./routes/user'));
app.use('/api/export', require('./routes/export'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payment', require('./routes/payment'));

let scheduledRoutes = require('./routes/scheduledroutes');
if (scheduledRoutes && typeof scheduledRoutes.default === 'function') {
  scheduledRoutes = scheduledRoutes.default;
}
app.use('/api/scheduled', authenticate, scheduledRoutes);

// ✅ Health check
app.get('/', (req, res) => res.send('✅ Backend is running!'));

// ✅ MongoDB connection & server start
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moneytrack', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  cron.schedule('0 0 * * *', async () => {
    const now = dayjs();
    const due = await ScheduledTransaction.find({ nextRun: { $lte: now.toDate() } });

    for (const rule of due) {
      await Transaction.create({
        userId: rule.userId,
        type: rule.type,
        category: rule.category,
        amount: rule.amount,
        date: rule.nextRun,
        description: rule.title
      });

      let next = dayjs(rule.nextRun);
      if (rule.frequency === 'monthly') next = next.add(1, 'month').date(rule.dayOfMonth);
      else next = next.add(1, 'year').month(rule.month - 1).date(rule.dayOfMonth);
      rule.nextRun = next.toDate();
      await rule.save();
    }
  });

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
.catch((err) => console.error('❌ MongoDB connection error:', err));
