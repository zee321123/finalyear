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
const authenticate = require('./middleware/authenticate');

require('./passport');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'secretkey';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.post('/api/payment/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Stripe Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    if (!userId) return res.status(400).send('Missing user ID');

    try {
      const user = await User.findById(userId);
      if (user) {
        user.isPremium = true;
        await user.save();
        console.log(`✅ Upgraded to premium: ${user.email}`);
      }
    } catch (err) {
      console.error('❌ Failed to update user:', err);
      return res.status(500).send('Webhook internal error');
    }
  }

  res.status(200).json({ received: true });
});

const allowedOrigins = ['http://localhost:5173', 'https://moneyapp01.netlify.app'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

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

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id, email: req.user.email }, SECRET, { expiresIn: '1d' });
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?token=${encodeURIComponent(token)}`;
    res.redirect(redirectUrl);
  }
);

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
if (scheduledRoutes && typeof scheduledRoutes.default === 'function') scheduledRoutes = scheduledRoutes.default;
app.use('/api/scheduled', authenticate, scheduledRoutes);

app.get('/', (req, res) => res.send('✅ Backend is running!'));

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined.');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
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
      next = rule.frequency === 'monthly'
        ? next.add(1, 'month').date(rule.dayOfMonth)
        : next.add(1, 'year').month(rule.month - 1).date(rule.dayOfMonth);

      rule.nextRun = next.toDate();
      await rule.save();
    }
  });

  app.post('/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    try {
      await Otp.create({ email, code: otp, expiresAt });
      await sendOtp(email, otp);
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (err) {
      console.error('Error sending OTP:', err);
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  });

  app.post('/auth/verify-otp', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and OTP code are required' });

    try {
      const otpRecord = await Otp.findOne({ email, code });
      if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP' });
      if (otpRecord.expiresAt < new Date()) return res.status(400).json({ message: 'OTP has expired' });

      otpRecord.verified = true;
      await otpRecord.save();
      res.status(200).json({ message: '✅ OTP verified successfully' });
    } catch (err) {
      console.error('Error verifying OTP:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/auth/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    try {
      const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
      if (!otpRecord || !otpRecord.verified) return res.status(400).json({ message: 'Please verify OTP before registering' });

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(409).json({ message: 'Email is already registered' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({ email, password: hashedPassword });
      await Otp.deleteMany({ email });

      const token = jwt.sign({ id: newUser._id, email: newUser.email }, SECRET, { expiresIn: '1d' });
      res.status(201).json({ message: 'User registered successfully', token });
    } catch (err) {
      console.error('Error during registration:', err);
      res.status(500).json({ message: 'Server error during registration' });
    }
  });

  app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(401).json({ message: 'Invalid email or password' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

      const token = jwt.sign({ id: user._id, email: user.email, role: user.role, isPremium: user.isPremium }, SECRET, { expiresIn: '1d' });
      res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error during login' });
    }
  });

  app.post('/auth/otp-reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message: 'All fields are required' });

    try {
      const otpRecord = await Otp.findOne({ email, code });
      if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP' });
      if (otpRecord.expiresAt < new Date()) return res.status(400).json({ message: 'OTP has expired' });

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      await Otp.deleteMany({ email });
      res.status(200).json({ message: '✅ Password reset successful' });
    } catch (err) {
      console.error('Password reset error:', err);
      res.status(500).json({ message: 'Server error during password reset' });
    }
  });

  // ✅ Toggle 2FA (requires authentication)
app.put('/auth/toggle-2fa', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.twoFactorEnabled = !user.twoFactorEnabled;
    await user.save();

    res.status(200).json({
      message: user.twoFactorEnabled ? '2FA enabled' : '2FA disabled',
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (err) {
    console.error('❌ Toggle 2FA error:', err);
    res.status(500).json({ message: 'Server error toggling 2FA' });
  }
});


  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch((err) => console.error('❌ MongoDB connection error:', err));
