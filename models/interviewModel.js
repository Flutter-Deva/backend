const mongoose = require('mongoose');

// Define the schema for the blog post
const interviewSchema = new mongoose.Schema({
  postId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
  },
  meetDetails: {
    type: String,
    required: true,
  },
  interviewTimestamp: {
    type: Date,
    default: Date.now,
  },
  createdTimeStamp: {
    type: Date,
    default: Date.now,
  },
});

// Create a model from the schema
const Interview = mongoose.model('Interview', interviewSchema);

// Export the model
module.exports = Interview;
