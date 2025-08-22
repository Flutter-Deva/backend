const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  userId: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
  },
  notificationType: {
    type: String,
    required: true, // e.g., "job", "interview", "interviewUpdated", "interviewCancelled"
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  email: {
    type: [String], // Array of email addresses
    required: true,
  },
  emailStatus: [{
    email: { type: String, required: true },
    read: { type: Boolean, default: false },
  }],
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
