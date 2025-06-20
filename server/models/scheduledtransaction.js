// Import mongoose and extract the Schema constructor
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the schema for scheduled transactions (recurring incomes or expenses)
const scheduledSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:      { type: String, required: true },   // Title or description of the scheduled item (e.g., "Monthly Rent")
  type:       { type: String, enum: ['income','expense'], required: true },   // Type of transaction: income or expense
  amount:     { type: Number, required: true },   // Amount of the transaction
  category:   { type: String, default: '' },   // How often it repeats: monthly or yearly
  frequency:  { type: String, enum: ['monthly','yearly'], required: true },
  dayOfMonth: { 
    type: Number, required: true, 
    min: [1, 'dayOfMonth must be ≥1'], 
    max: [31,'dayOfMonth must be ≤31']
  },
  // Month value (1–12); only needed for yearly frequency
  month:      { 
    type: Number, 
    min: [1, 'month must be ≥1'], 
    max: [12,'month must be ≤12'] 
  },
  currency:   { type: String, default: 'USD' }, 
  nextRun:    { type: Date,   required: true }
}, { timestamps: true });

// Guard against invalid years in nextRun
scheduledSchema.pre('save', function(next) {
  if (this.nextRun.getFullYear() > 9999 || this.nextRun.getFullYear() < 0) {
    return next(new Error('nextRun year out of range'));
  }
  next();
});

// Export the model so it can be used in other files
module.exports = mongoose.model('ScheduledTransaction', scheduledSchema);
