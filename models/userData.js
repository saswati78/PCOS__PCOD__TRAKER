
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userDataSchema = new Schema({
  username: { type: String, required: true },
  user_id: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: true },
  // serial_number: { type: Number, required: true },
  age: Number,
  weight: Number,
  height: Number,
  bmi: Number,
  cycle_length: Number, // e.g., 28 days
  period_length: Number, // e.g., 5 days

  last_period_date: { type: Date },  // Actual period start date (used for prediction)

  irregular_periods: Boolean,
  acne: Boolean,
  hair_growth: Boolean,
  skin_darkening: Boolean,
  bp_systolic: Number,
  bp_diastolic: Number,
  hb_count: Number,
  stress_level: { type: String, enum: ['Low', 'Moderate', 'High'] },
  physical_activity: { type: String, enum: ['Low', 'Moderate', 'High'] },
  pcos_prediction: { type: String, enum: ['Low Risk', 'Medium Risk', 'High Risk'] },
  createdAt: { type: Date, default: Date.now }
});

// Export the model
module.exports = mongoose.model('UserData', userDataSchema);
