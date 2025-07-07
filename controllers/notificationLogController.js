const mongoose = require('mongoose');
const NotificationLog = require('../models/notficationLogModel');  // Corrected model name
const User = require('../models/userModel');
const Job = require('../models/jobModel');
const FreeJob = require('../models/freeJobModel');
const AppliedJob = require('../models/appliedJobModel');
const Message = require('../models/messageModel');

// Function to get all notification logs
const getAllNotificationLogs = async (req, res) => {
  try {
    const notificationLogs = await NotificationLog.find();
    res.status(200).json(notificationLogs);
  } catch (error) {
    console.error('Error fetching notification logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to get a notification log by ID
const getNotificationLogById = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await NotificationLog.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification log not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to get candidate notifications
const getCandidateNotifications = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid receiver ID format' });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const email = user.email;

    const notificationLogs = await NotificationLog.find({
      "emailStatus.email": email,
      "emailStatus.read": false,
    });

    const jobIds = notificationLogs.map(log => log.jobId);
    const jobs = [];

    for (const jobId of jobIds) {
      let job = await Job.findById(jobId) || await FreeJob.findById(jobId);
      if (job) jobs.push(job);
    }

    const messages = await Message.find({
      receiverId: id,
      read: false,
    }).sort({ createdAt: -1 }).limit(1);

    if (messages.length > 0) {
      const sender = await User.findById(messages[0].senderId);
      if (sender) messages[0].senderName = sender.username;
    }

    const notificationData = {
      jobs,
      messages: messages.map(msg => ({
        ...msg.toObject(),
        senderName: msg.senderName || null,
      })),
    };

    res.status(200).json({
      message: 'Data fetched successfully.',
      data: notificationData,
    });
  } catch (error) {
    console.error('Error retrieving candidate notification data:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// Function to update the read status of a notification log
const updateNotificationReadStatus = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const notification = await NotificationLog.findOne({ jobId: id });
    if (!notification) return res.status(404).json({ message: 'Notification log not found' });

    const emailStatus = notification.emailStatus.find(item => item.email === email);
    if (!emailStatus) return res.status(404).json({ message: 'Email not found in notification log' });

    emailStatus.read = true;
    await notification.save();

    res.status(200).json({ message: 'Email status updated successfully', notification });
  } catch (error) {
    console.error('Error updating email status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to get employer notifications
const getEmployerNotifications = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid employer ID format' });
  }

  try {
    const jobs = [
      ...(await Job.find({ user_id: id })),
      ...(await FreeJob.find({ user_id: id })),
    ];

    const jobIds = jobs.map(job => job._id);

    const appliedJobs = await AppliedJob.find({
      post_id: { $in: jobIds },
      seen: false,
    });

    const notifications = [];
    for (const appliedJob of appliedJobs) {
      const user = await User.findById(appliedJob.user_id);
      if (!user) continue;

      let job = await Job.findById(appliedJob.post_id) || await FreeJob.findById(appliedJob.post_id);
      if (!job) continue;

      notifications.push({
        appliedJobId: appliedJob._id,
        appliedUserId: appliedJob.user_id,
        userName: user.name,
        userEmail: user.email,
        jobTitle: job.jobTitle || 'Job title not available',
        postId: appliedJob.post_id,
      });
    }

    const messages = await Message.find({
      receiverId: id,
      read: false,
    }).sort({ createdAt: -1 }).limit(1);

    const notificationData = {
      jobs,
      notifications,
      messages,
    };

    res.status(200).json({
      message: 'Employer notifications fetched successfully.',
      data: notificationData,
    });
  } catch (error) {
    console.error('Error retrieving employer notification data:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

module.exports = {
  getAllNotificationLogs,
  getNotificationLogById,
  getCandidateNotifications,
  updateNotificationReadStatus,
  getEmployerNotifications,
};
