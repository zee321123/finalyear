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
const authenticate = require('./middleware/authenticate');

require('./passport');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'secretkey';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// ✅ Webhook raw body parser (MUST be before express.json)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// ✅ Stripe Webhook Route
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

    if (!userId) {
      console.warn('⚠️ No userId in metadata');
      return res.status(400).send('Missing user ID');
    }

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

// ✅ CORS Setup
const allowedOrigins = [
  'http://localhost:5173',
  'https://moneyapp01.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.netlify.app')
    ) {
      return callback(null, true);
    }
    console.warn(`❌ CORS blocked: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// ✅ Middleware
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

// ✅ Google OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id, email: req.user.email }, SECRET, { expiresIn: '1d' });
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?token=${encodeURIComponent(token)}`;
    res.redirect(redirectUrl);
  }
);

// ✅ API Routes
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

// ✅ Health Check
app.get('/', (req, res) => res.send('✅ Backend is running!'));

// ✅ MongoDB Connection + Scheduled Job
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not defined.');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  // ✅ Cron: Run scheduled transactions
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

  // ✅ Send OTP Route
  app.post('/auth/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
      await Otp.create({
        email,
        code: otp,
        expiresAt
      });

      await sendOtp(email, otp);

      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (err) {
      console.error('Error sending OTP:', err);
      res.status(500).json({ message: 'Failed to send OTP' });
    }
  });

  // ✅ Verify OTP Route
  app.post('/auth/verify-otp', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and OTP code are required' });
    }

    try {
      const otpRecord = await Otp.findOne({ email, code });

      if (!otpRecord) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (otpRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      // ✅ Optional: delete used OTP
      await Otp.deleteOne({ _id: otpRecord._id });

      res.status(200).json({ message: '✅ OTP verified successfully' });
    } catch (err) {
      console.error('Error verifying OTP:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}).catch((err) => console.error('❌ MongoDB connection error:', err));
