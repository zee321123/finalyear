// Import required modules
const express = require('express');
const router = express.Router();
// Stripe setup using secret key from .env file
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Middleware to make sure user is logged in
const authenticate = require('../middleware/authenticate');

// Route to create a Stripe checkout session for subscriptions
router.post('/create-checkout-session', authenticate, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Only accept card payments
      mode: 'subscription',
      line_items: [
        {
          price: 'price_1ROzhyRxf1J6QODU0GemRziD', 
          quantity: 1,
        },
      ],
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/dashboard?paid=true`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?cancelled=true`,
      metadata: {
        userId: req.user.id, // Attach user ID for use in Stripe webhook
      },
    });

    // Return the session URL so frontend can redirect user to Stripe
    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session creation error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Export the router to be used in the main app
module.exports = router;
