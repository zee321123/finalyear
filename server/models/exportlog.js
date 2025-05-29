// Import Mongoose library to define schema and interact with MongoDB
const mongoose = require('mongoose');

// Define the schema for tracking export actions (CSV/PDF downloads)
const exportLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Type of export: can only be 'csv' or 'pdf'
  type: {
    type: String,
    enum: ['csv', 'pdf'], 
    required: true,
  },
  // Time when the export was created (defaults to current time)
  createdAt: {
    type: Date,
    default: Date.now,
  }
});
// Export the model so it can be used in routes/controllers
module.exports = mongoose.model('ExportLog', exportLogSchema);
