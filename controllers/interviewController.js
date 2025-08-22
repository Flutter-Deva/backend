require('dotenv').config();
const Interview = require('../models/interviewModel');
const Job = require('../models/jobModel');
const FreeJob = require('../models/freeJobModel');
const User = require('../models/userModel');
const NotificationLog = require('../models/notficationLogModel');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// ----------------- Nodemailer setup -----------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Email helper
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
  }
};

// NotificationLog helper
const sendNotificationLog = async ({ userIds, jobId, interviewId, type, emails }) => {
  await NotificationLog.create({
    userId: userIds,
    jobId,
    interviewId,
    notificationType: type,
    email: emails,
    emailStatus: emails.map(e => ({ email: e, read: false }))
  });
};

// ======================================================
// CREATE INTERVIEW
// ======================================================
const createInterview = async (req, res) => {
  try {
    const { postId, userId, employeeId, meetDetails, interviewTimestamp } = req.body;

    // 1. Get job
    let job = await Job.findById(postId) || await FreeJob.findById(postId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // 2. Fetch users
    const user = await User.findById(userId);
    const employee = await User.findById(employeeId);
    if (!user || !employee) return res.status(404).json({ message: 'User or Employee not found' });

    // 3. Save interview
    const interview = await new Interview({ postId, userId, employeeId, meetDetails, interviewTimestamp }).save();
    const formattedTime = new Date(interviewTimestamp).toLocaleString();

    // 4. Save NotificationLog
    await sendNotificationLog({
      userIds: [userId, employeeId],
      jobId: postId,
      interviewId: interview._id,
      type: 'interview',
      emails: [user.email, employee.email]
    });

    // 5. Send emails
    const emailText = `📌 Interview Scheduled\nJob: ${job.jobTitle}\nMeet: ${meetDetails}\nTime: ${formattedTime}`;
    await sendEmail(user.email, 'Interview Scheduled', emailText);
    await sendEmail(employee.email, 'Interview Scheduled', emailText);

    // 6. Send FCM to candidate
    if (user?.deviceToken) {
      const fcmPayload = {
        token: user.deviceToken,
        notification: {
          title: 'Interview Scheduled',
          body: `For ${job.jobTitle} at ${formattedTime}`
        },
        data: {
          type: 'interview',
          jobTitle: job.jobTitle,
          meetDetails,
          interviewTimestamp: interviewTimestamp.toString(),
          interviewId: interview._id.toString(),
          postId: postId.toString()
        }
      };
      await admin.messaging().send(fcmPayload).catch(err => console.error('❌ FCM error:', err));
    }

    res.status(201).json({ message: 'Interview created successfully', interview });
  } catch (error) {
    console.error('Error in createInterview:', error);
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// UPDATE INTERVIEW
// ======================================================
const updateInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { meetDetails, interviewTimestamp } = req.body;

    const interview = await Interview.findByIdAndUpdate(
      interviewId,
      { meetDetails, interviewTimestamp },
      { new: true }
    );
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const user = await User.findById(interview.userId);
    const employee = await User.findById(interview.employeeId);
    if (!user || !employee) return res.status(404).json({ message: 'Users not found' });

    const formattedTime = new Date(interview.interviewTimestamp).toLocaleString();
    const emailText = `✏️ Interview Updated\nNew Meet: ${meetDetails}\nNew Time: ${formattedTime}`;

    await sendEmail(user.email, 'Interview Updated', emailText);
    await sendEmail(employee.email, 'Interview Updated', emailText);

    await sendNotificationLog({
      userIds: [interview.userId, interview.employeeId],
      jobId: interview.postId,
      interviewId: interview._id,
      type: 'interviewUpdated',
      emails: [user.email, employee.email]
    });

    res.json({ message: 'Interview updated successfully', interview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// DELETE INTERVIEW
// ======================================================
const deleteInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findByIdAndDelete(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const user = await User.findById(interview.userId);
    const employee = await User.findById(interview.employeeId);

    if (user && employee) {
      const emailText = `❌ Interview Cancelled\nPrevious Time: ${new Date(interview.interviewTimestamp).toLocaleString()}`;
      await sendEmail(user.email, 'Interview Cancelled', emailText);
      await sendEmail(employee.email, 'Interview Cancelled', emailText);

      await sendNotificationLog({
        userIds: [interview.userId, interview.employeeId],
        jobId: interview.postId,
        interviewId: interview._id,
        type: 'interviewCancelled',
        emails: [user.email, employee.email]
      });
    }

    res.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// GET INTERVIEW BY ID
// ======================================================
const getInterviewById = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const user = await User.findById(interview.userId, 'name email');
    let job = await Job.findById(interview.postId, 'jobTitle jobType') || 
              await FreeJob.findById(interview.postId, 'jobTitle jobType');

    res.json({ interview, user, job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// GET INTERVIEWS BY USER (Candidate)
// ======================================================
const getInterviewsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const interviews = await Interview.find({ userId });
    if (!interviews.length) return res.status(404).json({ message: 'No interviews found' });

    const detailed = await Promise.all(interviews.map(async i => {
      const employee = await User.findById(i.employeeId, 'companyContactPerson.name companyContactPerson.officialEmail');
      let job = await Job.findById(i.postId, 'jobTitle jobType') || 
                await FreeJob.findById(i.postId, 'jobTitle jobType');
      return { interview: i, employee, job };
    }));

    res.json(detailed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// GET INTERVIEWS BY EMPLOYEE (Employer)
// ======================================================
const getInterviewsByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const interviews = await Interview.find({ employeeId });
    if (!interviews.length) return res.status(404).json({ message: 'No interviews found' });

    const detailed = await Promise.all(interviews.map(async i => {
      const user = await User.findById(i.userId, 'name email');
      let job = await Job.findById(i.postId, 'jobTitle jobType') || 
                await FreeJob.findById(i.postId, 'jobTitle jobType');
      return { interview: i, user, job };
    }));

    res.json(detailed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createInterview,
  updateInterview,
  deleteInterview,
  getInterviewById,
  getInterviewsByUserId,
  getInterviewsByEmployeeId,
};
