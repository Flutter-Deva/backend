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
    required: true,
  },
  notificationType: {
    type: String,
    required: true,
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
    read: { type: Boolean, default: false }, // Track read/unread status
  }],
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);