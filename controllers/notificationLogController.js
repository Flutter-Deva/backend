require("dotenv").config();
const mongoose = require("mongoose");
const NotificationLog = require("../models/notficationLogModel");
const User = require("../models/userModel");
const Job = require("../models/jobModel");
const FreeJob = require("../models/freeJobModel");
const AppliedJob = require("../models/appliedJobModel");
const Message = require("../models/messageModel");

/**
 * ✅ Get all notification logs
 */
const getAllNotificationLogs = async (req, res) => {
  try {
    const notificationLogs = await NotificationLog.find()
      .populate("jobId")
      .populate("interviewId");

    res.status(200).json(notificationLogs);
  } catch (error) {
    console.error("❌ Error fetching notification logs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Get a single notification log by ID
 */
const getNotificationLogById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid notification ID format" });
  }

  try {
    const notification = await NotificationLog.findById(id)
      .populate("jobId")
      .populate("interviewId");

    if (!notification) {
      return res.status(404).json({ message: "Notification log not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error("❌ Error fetching notification by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Get candidate notifications
 */
const getCandidateNotifications = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid candidate ID format" });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const email = user.email;

    // Unread notification logs for this candidate
    const notificationLogs = await NotificationLog.find({
      "emailStatus.email": email,
      "emailStatus.read": false,
    })
      .populate("jobId")
      .populate("interviewId");

    const jobs = notificationLogs
      .filter((n) => n.notificationType === "job")
      .map((n) => n.jobId);

    const interviews = notificationLogs
      .filter((n) =>
        ["interview", "interviewUpdated", "interviewCancelled"].includes(
          n.notificationType
        )
      )
      .map((n) => ({
        interviewId: n.interviewId?._id,
        jobId: n.jobId?._id,
        jobTitle: n.jobId?.jobTitle || "N/A",
        type: n.notificationType,
        time: n.timestamp,
      }));

    // Latest unread message
    const messages = await Message.find({ receiverId: id, read: false })
      .sort({ createdAt: -1 })
      .limit(1);

    const notificationData = {
      jobs,
      interviews,
      messages: messages.map((msg) => ({
        ...msg.toObject(),
        senderName: msg.senderName || null,
      })),
    };

    res.status(200).json({
      message: "Candidate notifications fetched successfully.",
      data: notificationData,
    });
  } catch (error) {
    console.error("❌ Error retrieving candidate notification data:", error);
    res.status(500).json({ message: "Server error while fetching notifications" });
  }
};

/**
 * ✅ Update read status of a notification
 */
const updateNotificationReadStatus = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid notification ID format" });
  }

  try {
    const notification = await NotificationLog.findById(id);
    if (!notification)
      return res.status(404).json({ message: "Notification log not found" });

    const emailStatus = notification.emailStatus.find(
      (item) => item.email === email
    );

    if (!emailStatus) {
      return res
        .status(404)
        .json({ message: "Email not found in notification log" });
    }

    emailStatus.read = true;
    await notification.save();

    res
      .status(200)
      .json({ message: "Email status updated successfully", notification });
  } catch (error) {
    console.error("❌ Error updating email status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Get employer notifications
 */
const getEmployerNotifications = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid employer ID format" });
  }

  try {
    // 1. Jobs posted by this employer
    const jobs = [
      ...(await Job.find({ user_id: id })),
      ...(await FreeJob.find({ user_id: id })),
    ];
    const jobIds = jobs.map((job) => job._id);

    // 2. New applied jobs
    const appliedJobs = await AppliedJob.find({
      post_id: { $in: jobIds },
      seen: false,
    });

    const appliedJobNotifications = await Promise.all(
      appliedJobs.map(async (appliedJob) => {
        const user = await User.findById(appliedJob.user_id);
        if (!user) return null;

        const job =
          (await Job.findById(appliedJob.post_id)) ||
          (await FreeJob.findById(appliedJob.post_id));
        if (!job) return null;

        return {
          appliedJobId: appliedJob._id,
          appliedUserId: appliedJob.user_id,
          userName: user.name,
          userEmail: user.email,
          jobTitle: job.jobTitle || "N/A",
          postId: appliedJob.post_id,
        };
      })
    );

    // 3. Interview notifications (Unread for employer)
    const interviewLogs = await NotificationLog.find({
      userId: id,
      notificationType: {
        $in: ["interview", "interviewUpdated", "interviewCancelled"],
      },
      "emailStatus.read": false,
    })
      .populate("interviewId")
      .populate("jobId");

    const interviewNotifications = interviewLogs.map((log) => ({
      interviewId: log.interviewId?._id,
      jobId: log.jobId?._id,
      jobTitle: log.jobId?.jobTitle,
      type: log.notificationType,
      time: log.timestamp,
    }));

    // 4. Messages
    const messages = await Message.find({
      receiverId: id,
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(1);

    const notificationData = {
      jobs,
      appliedJobNotifications: appliedJobNotifications.filter(Boolean),
      interviewNotifications,
      messages,
    };

    res.status(200).json({
      message: "Employer notifications fetched successfully.",
      data: notificationData,
    });
  } catch (error) {
    console.error("❌ Error retrieving employer notification data:", error);
    res.status(500).json({ message: "Server error while fetching notifications" });
  }
};

module.exports = {
  getAllNotificationLogs,
  getNotificationLogById,
  getCandidateNotifications,
  updateNotificationReadStatus,
  getEmployerNotifications,
};
