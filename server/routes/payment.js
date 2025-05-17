const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const authenticate = require('../middleware/authenticate');

// ✅ 1. Create Checkout Session (Recurring Subscription)
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // ✅ Fixed: use 'subscription' for recurring plans
      line_items: [
        {
          price: 'price_1ROzhyRxf1J6QODU0GemRziD', // ✅ Your recurring Stripe price ID
          quantity: 1,
        },
      ],
      customer_email: req.user.email,
      success_url: 'http://localhost:5173/dashboard?paid=true',
      cancel_url: 'http://localhost:5173/upgrade',
      metadata: {
        userId: req.user.id,
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session creation error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ✅ 2. Handle Stripe Webhook (Triggered after successful payment)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const endpointSecret = 'whsec_a993f23e9a5a0e8bcd1032df531d905213b3fd2bed344aa57bd523fb39eb863b';
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;

    try {
      const User = require('../models/user');
      await User.findByIdAndUpdate(userId, { isPremium: true });
      console.log(`✅ User ${userId} upgraded to Premium`);
    } catch (err) {
      console.error('❌ Failed to update user:', err.message);
    }
  }

  res.status(200).send('✅ Webhook received');
});

module.exports = router;
