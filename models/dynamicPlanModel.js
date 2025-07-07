const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dynamicPlanSchema = new Schema(
{ 
  plan_name: {
    type: String,
  },
  plan_price: {
    type: String,
  },
  no_of_days: {
    type: Number,
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


const DynamicPlan = mongoose.model('dynamicPlan', dynamicPlanSchema);

module.exports = DynamicPlan;