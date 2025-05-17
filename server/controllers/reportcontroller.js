// server/controllers/reportcontroller.js
const mongoose    = require('mongoose');
const Transaction = require('../models/transaction');

exports.getReport = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // 1) Build `match` only if user supplied dates
    const match = { userId };
    let startDate = null;
    let endDate   = null;

    if (req.query.start) {
      startDate = new Date(req.query.start);
      match.date = { ...match.date, $gte: startDate };
    }
    if (req.query.end) {
      endDate = new Date(req.query.end);
      endDate.setHours(23,59,59,999);
      match.date = { ...match.date, $lte: endDate };
    }

    // 2) Determine full-range bounds for trend if no dates provided
    if (!startDate || !endDate) {
      const bounds = await Transaction.aggregate([
        { $match: { userId } },
        { $group: {
            _id: null,
            minDate: { $min: '$date' },
            maxDate: { $max: '$date' }
        }}
      ]);
      if (bounds.length) {
        startDate = startDate || bounds[0].minDate;
        endDate   = endDate   || bounds[0].maxDate;
      } else {
        // no transactions at all: use today
        startDate = startDate || new Date();
        endDate   = endDate   || new Date();
      }
    }

    // 3) Totals & categories remain (optional – client now recomputes these)
    const totals = await Transaction.aggregate([
      { $match: match },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);
    const byCategory = await Transaction.aggregate([
      { $match: match },
      { $group: {
          _id: { $ifNull: ['$category','Uncategorized'] },
          total: { $sum: '$amount' }
      }}
    ]);

    // 4) Trend – dynamic granularity based on full-range span
    const spanDays = Math.ceil((endDate - startDate) / (1000*60*60*24));
    let periodField;
    if (spanDays <= 30) {
      periodField = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    } else if (spanDays <= 90) {
      periodField = {
        $concat: [
          { $toString: { $isoWeekYear: '$date' } },
          '-W',
          { $toString: { $isoWeek: '$date' } }
        ]
      };
    } else {
      periodField = { $dateToString: { format: '%Y-%m', date: '$date' } };
    }

    const trend = await Transaction.aggregate([
      { $match: match },
      { $addFields: { period: periodField } },
      { $group: {
          _id: { period: '$period', type: '$type' },
          total: { $sum: '$amount' }
      }},
      { $group: {
          _id: '$_id.period',
          income:  { $sum: { $cond: [ { $eq: ['$_id.type','income'] }, '$total', 0 ] } },
          expense: { $sum: { $cond: [ { $eq: ['$_id.type','expense']}, '$total', 0 ] } }
      }},
      { $sort: { '_id': 1 } }
    ]);

    // 5) Summary numbers (optional)
    const totalIncome   = totals.find(t => t._id==='income')?.total   || 0;
    const totalExpenses = totals.find(t => t._id==='expense')?.total  || 0;
    const balance       = totalIncome - totalExpenses;

    return res.json({
      totalIncome,
      totalExpenses,
      balance,
      totals,
      byCategory,
      trend
    });
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ message: 'Failed to fetch report', error: err.message });
  }
};
