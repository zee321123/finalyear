const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const authenticate = require('../middleware/authenticate');

// ✅ Create Checkout Session for Recurring Subscription
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: 'price_1ROzhyRxf1J6QODU0GemRziD', // Replace with your actual Stripe price ID
          quantity: 1,
        },
      ],
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/dashboard?paid=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?cancelled=true`,
      metadata: {
        userId: req.user.id, // Passed to webhook for user upgrade
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session creation error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

module.exports = router;
