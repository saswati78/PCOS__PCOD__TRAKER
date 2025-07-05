const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const symptomLogSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "UserData", required: true },
  date: { type: Date, required: true },

  // Extra Health Inputs for Prediction
  age: { type: Number, required: true },
  weight: { type: Number, required: true },           // in kg
  height: { type: Number, required: true },           // in cm
  bmi: { type: Number, required: true },              // calculated or entered
  cycle_length: { type: Number, required: true },
  irregular_periods: { type: Boolean, required: true },
  acne: { type: Boolean, required: true },
  hair_growth: { type: Boolean, required: true },
  skin_darkening: { type: Boolean, required: true },
  bp_systolic: { type: Number, required: true },
  bp_diastolic: { type: Number, required: true },
  hb_count: { type: Number, required: true },         // in g/dL

  // Regular Daily Logs
  symptoms: [String],
  mood: { type: String, enum: ["Happy", "Anxious", "Irritable", "Sad"] },
  sleep_hours: Number,
  water_intake_liters: Number,
  physical_activity: { type: String, enum: ["Low", "Moderate", "High"] },
  diet_quality: { type: String, enum: ["Poor", "Average", "Good", "Excellent"] },
  notes: String,

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SymptomLog", symptomLogSchema);
