const mongoose = require('mongoose');

// Define the schema for the Interview
const interviewSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  meetDetails: {
    type: String,
    required: true,
  },
  interviewTimestamp: {
    type: Date,
    required: true,
  },
  createdTimeStamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Interview', interviewSchema);
