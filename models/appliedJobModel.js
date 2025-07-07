const mongoose = require('mongoose');
const { Schema } = mongoose;

const appliedJobSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  post_id: {
    type: Schema.Types.ObjectId,

  },
  post_type: {
    type: String,
    enum: ['Job', 'FreeJobs'], // Define which models the post_id can reference

  },
  plan_id: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  seen: {
    type: Boolean,
    default: false,
  },
});

const AppliedJob = mongoose.model('AppliedJob', appliedJobSchema);
module.exports = AppliedJob;