const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const packageTypes = ['Basic', 'Standard', 'Extended'];

const planSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan_name: {
    type: String,
    enum: packageTypes,
  },
  plan_price: {
    type: String,
  },
  bought_timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  no_of_days: {
    type: Number,
    required: true
  },
  start_date: {
    type: Date,
    default: Date.now, // Set to current date and time by default
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  paid_jobs: {
    type: Number,
    required: true
  },
  free_jobs: {
    type: Number,
    required: true
  },
  apply_paid_jobs: {
    type: Number,
    required: true,
    default: 0
  },
  apply_free_jobs: {
    type: Number,
    required: true,
    default: 0
  }
});


const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;