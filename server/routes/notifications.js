// routes/notifications.js
const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const Scheduled = require('../models/scheduledtransaction');
const ExportLog = require('../models/exportlog'); // Make sure this exists
const Transaction = require('../models/transaction');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = [];

    // 1. ✅ Upcoming Scheduled Transactions (within 3 days)
    const now = dayjs();
    const in3Days = now.add(3, 'day');
    const upcoming = await Scheduled.find({
      userId,
      nextRun: { $gte: now.toDate(), $lte: in3Days.toDate() }
    });

    for (const item of upcoming) {
      notifications.push({
        message: `Upcoming ${item.type} of ${item.amount} on ${dayjs(item.nextRun).format('DD MMM')}`,
        read: false
      });
    }

    // 2. ✅ Export Limit Warning (for free users)
    if (!req.user.isPremium) {
      const count = await ExportLog.countDocuments({ userId });
      if (count >= 4) {
        notifications.push({
          message: `⚠️ You’ve used ${count}/5 free exports. Upgrade to unlock more.`,
          read: false
        });
      }
    }

    // 3. ✅ Transaction Reminder (if no recent activity this week)
    const weekAgo = now.subtract(7, 'day');
    const recentTxns = await Transaction.find({ userId, date: { $gte: weekAgo.toDate() } });
    if (recentTxns.length === 0) {
      notifications.push({
        message: `🧾 You haven’t logged any transactions this week. Don’t forget to add them!`,
        read: false
      });
    }

    return res.json(notifications);
  } catch (err) {
    console.error('❌ Notification fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

module.exports = router;
