const express   = require('express');
const router    = express.Router();
const dayjs     = require('dayjs');
const Scheduled = require('../models/scheduledtransaction');

// ✅ Helper: check if user is on free plan
function isFreeUser(user) {
  return !user.isPremium && user.role !== 'admin';
}

// ✅ Helper to compute nextRun
function computeNextRun({ frequency, dayOfMonth, month }) {
  const now = dayjs();
  let next;

  if (frequency === 'monthly') {
    next = now.date(dayOfMonth);
    if (next.isBefore(now, 'day')) {
      next = next.add(1, 'month');
    }
  } else {
    next = now.month(month - 1).date(dayOfMonth);
    if (next.isBefore(now, 'day')) {
      next = next.add(1, 'year');
    }
  }

  const dim = next.daysInMonth();
  const safeDay = Math.min(dayOfMonth, dim);
  next = next.date(safeDay);

  return next.toDate();
}

// ✅ GET all scheduled transactions
router.get('/', async (req, res) => {
  try {
    console.log('📅 [GET] Fetching schedules for user:', req.user.id);
    const rules = await Scheduled.find({ userId: req.user.id }).sort('nextRun');
    return res.status(200).json(rules);
  } catch (err) {
    console.error('❌ [GET] Failed to fetch schedules:', err);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// ✅ POST create a new schedule
router.post('/', async (req, res) => {
  try {
    const existingCount = await Scheduled.countDocuments({ userId: req.user.id });

    if (isFreeUser(req.user) && existingCount >= 2) {
      return res.status(403).json({
        error: 'Free plan limit reached. Upgrade to Premium to create more scheduled rules.'
      });
    }

    const {
      title,
      type,
      amount,
      category,
      frequency,
      dayOfMonth,
      month,
      currency = 'USD'
    } = req.body;

    const nextRun = computeNextRun({ frequency, dayOfMonth, month });

    const schedDoc = new Scheduled({
      userId: req.user.id,
      title,
      type,
      amount,
      category,
      frequency,
      dayOfMonth,
      month,
      currency,
      nextRun
    });

    await schedDoc.save();
    return res.status(201).json(schedDoc);
  } catch (err) {
    console.error('❌ [POST] Error creating schedule:', err);
    return res.status(400).json({ error: err.message });
  }
});

// ✅ PUT update an existing schedule
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      type,
      amount,
      category,
      frequency,
      dayOfMonth,
      month,
      currency = 'USD'
    } = req.body;

    const nextRun = computeNextRun({ frequency, dayOfMonth, month });

    const updated = await Scheduled.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        title,
        type,
        amount,
        category,
        frequency,
        dayOfMonth,
        month,
        currency,
        nextRun
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Schedule not found' });
    return res.json(updated);
  } catch (err) {
    console.error('❌ [PUT] Error updating schedule:', err);
    return res.status(400).json({ error: err.message });
  }
});

// ✅ DELETE schedule
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Scheduled.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!deleted) return res.status(404).json({ error: 'Schedule not found' });
    return res.json({ message: 'Schedule deleted' });
  } catch (err) {
    console.error('❌ [DELETE] Failed to delete schedule:', err);
    return res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

module.exports = router;
