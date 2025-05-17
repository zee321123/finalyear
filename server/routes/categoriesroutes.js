const express = require('express');
const router  = express.Router();
const authenticate = require('../middleware/authenticate');
const ctrl    = require('../controllers/categoryController');

router.use(authenticate);

router.get('/',      ctrl.getCategories);
router.post('/',     ctrl.createCategory);
router.put('/:id',   ctrl.updateCategory);
router.delete('/:id',ctrl.deleteCategory);

module.exports = router;
