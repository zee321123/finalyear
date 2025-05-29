const express = require('express');
const router = express.Router();
const { getReport } = require('../controllers/reportcontroller');
const authenticate = require('../middleware/authenticate'); 


// ================================
// GET /api/report
// This route generates and returns a financial report 
// for the logged-in user. It is protected by authentication.
// ================================
router.get('/', authenticate, getReport);


module.exports = router;
