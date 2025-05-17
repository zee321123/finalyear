const mongoose = require('mongoose');
const { Schema } = mongoose;

const scheduledSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:      { type: String, required: true },
  type:       { type: String, enum: ['income','expense'], required: true },
  amount:     { type: Number, required: true },
  category:   { type: String, default: '' },
  frequency:  { type: String, enum: ['monthly','yearly'], required: true },
  dayOfMonth: { 
    type: Number, required: true, 
    min: [1, 'dayOfMonth must be ≥1'], 
    max: [31,'dayOfMonth must be ≤31']
  },
  month:      { 
    type: Number, 
    min: [1, 'month must be ≥1'], 
    max: [12,'month must be ≤12'] 
  },
  currency:   { type: String, default: 'USD' }, // ✅ NEW FIELD
  nextRun:    { type: Date,   required: true }
}, { timestamps: true });

// Guard against invalid years in nextRun
scheduledSchema.pre('save', function(next) {
  if (this.nextRun.getFullYear() > 9999 || this.nextRun.getFullYear() < 0) {
    return next(new Error('nextRun year out of range'));
  }
  next();
});

module.exports = mongoose.model('ScheduledTransaction', scheduledSchema);
