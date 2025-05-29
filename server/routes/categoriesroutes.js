// Import required modules
const express = require('express');
const router  = express.Router();
const authenticate = require('../middleware/authenticate'); // Middleware to verify JWT token and authenticate user
const ctrl    = require('../controllers/categoryController'); // Controller that handles category logic

// Apply authentication to all category routes
router.use(authenticate);

// GET all categories for the logged-in user
router.get('/',      ctrl.getCategories);
router.post('/',     ctrl.createCategory); // POST a new category (requires name and type)
router.put('/:id',   ctrl.updateCategory);
router.delete('/:id',ctrl.deleteCategory); // DELETE a category and its related transactions by ID

// Export the configured router
module.exports = router;
