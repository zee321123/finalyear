// Import Mongoose library to define schema and interact with MongoDB
const mongoose = require('mongoose');

// Define the schema for a Category document in MongoDB
const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

//  Compound index: one user can't create duplicate names, but others can
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Export the Category model so it can be used in controllers
module.exports = mongoose.model('Category', categorySchema);
