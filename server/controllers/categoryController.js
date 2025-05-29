// Import required models
const Category = require('../models/category');
const Transaction = require('../models/transaction');

// Helper function to check if the user is on a free plan (not premium and not admin)
const isFreeUser = (user) => !user.isPremium && user.role !== 'admin';

// ====================== GET CATEGORIES ======================
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category
      .find({ userId: req.user.id })
      .sort('type name');

    res.status(200).json(categories);
  } catch (err) {
    console.error('❌ Error fetching categories:', err);
    res.status(500).json({ message: 'Server error fetching categories' });
  }
};

// ====================== CREATE CATEGORY ======================
exports.createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;

    // Check if required fields are provided
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    const existingCount = await Category.countDocuments({ userId: req.user.id });

    if (isFreeUser(req.user) && existingCount >= 5) {
      return res.status(403).json({
        message: 'Free plan limit reached. Upgrade to Premium to add more categories.'
      });
    }

      // Create and save the new category
    const category = new Category({ userId: req.user.id, name, type });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You already have a category with this name.' });
    }
    console.error('❌ Error creating category:', err);
    res.status(500).json({ message: 'Server error creating category' });
  }
};

// ====================== UPDATE CATEGORY ======================
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    const duplicate = await Category.findOne({
      _id: { $ne: id },
      name,
      userId: req.user.id
    });

    if (duplicate) {
      return res.status(409).json({ message: 'You already have a category with this name.' });
    }

    // Update the category by ID and return the updated document
    const category = await Category.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { name, type },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (err) {
    console.error('❌ Error updating category:', err);
    res.status(500).json({ message: 'Server error updating category' });
  }
};

// ====================== DELETE CATEGORY ======================
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete the category belonging to the user
    const deletedCategory = await Category.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await Transaction.deleteMany({ category: deletedCategory._id, userId: req.user.id });

    res.status(200).json({
      message: 'Category and associated transactions deleted successfully.'
    });

  } catch (err) {
    console.error('❌ Error deleting category and transactions:', err);
    res.status(500).json({ message: 'Server error deleting category' });
  }
};
