// Import JWT module to verify tokens
const jwt = require('jsonwebtoken');

// Import the User model to fetch user details from database
const User = require('../models/user');

// Middleware to protect routes by verifying JWT and fetching user
module.exports = async (req, res, next) => {
  // Get the Authorization header from the request
  const header = req.headers.authorization;

  // Check if the Authorization header is missing
  if (!header) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  // Extract token from the "Bearer <token>" format
  const token = header.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Malformed Authorization header' });
  }

  try {
    // Verify the token using secret from .env or fallback
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

    // Fetch the user associated with the token
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request object for use in other routes
    req.user = user;
    
    // Continue to the next middleware or route handler
    next();
  } catch (err) {
    // Handle invalid or expired token
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
