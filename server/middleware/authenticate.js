const jwt = require('jsonwebtoken');
const User = require('../models/user'); // ✅ import the user model

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = header.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');

    // ✅ Fetch full user from DB
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // ✅ Attach entire user to req.user
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
