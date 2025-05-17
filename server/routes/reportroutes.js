const express = require('express');
const router = express.Router();
const { getReport } = require('../controllers/reportcontroller');
const authenticate = require('../middleware/authenticate'); // ✅ already exists



// GET /api/reports
router.get('/', authenticate, getReport);


module.exports = router;
