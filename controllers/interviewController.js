require('dotenv').config();
const Interview = require('../models/interviewModel');
const Job = require('../models/jobModel');
const FreeJob = require('../models/freeJobModel');
const User = require('../models/userModel'); // Import the User model
const nodemailer = require('nodemailer');

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send emails
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

// Create an interview
const createInterview = async (req, res) => {
  try {
    const { postId, userId, employeeId, meetDetails, interviewTimestamp } = req.body;

    // Find job title
    let job = await Job.findById(postId) || await FreeJob.findById(postId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Find user and employee
    const user = await User.findById(userId);
    const employee = await User.findById(employeeId);

    if (!user || !employee) {
      return res.status(404).json({ message: 'User or Employee not found' });
    }

    const interview = new Interview({ postId, userId, employeeId, meetDetails, interviewTimestamp });
    await interview.save();

    // Format interview date and time
    const formattedTime = new Date(interviewTimestamp).toLocaleString();

    // Email text
    const emailText = `
      An interview has been scheduled for the job title: ${job.jobTitle}
      Meet Details: ${meetDetails}
      Interview Timing: ${formattedTime}
    `;

    await sendEmail(user.email, 'Interview Scheduled', emailText);
    await sendEmail(employee.email, 'Interview Scheduled', emailText);

    res.status(201).json({ message: 'Interview created successfully', interview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an interview
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

    // Find user and employee
    const user = await User.findById(interview.userId);
    const employee = await User.findById(interview.employeeId);

    if (user && employee) {
      const formattedTime = new Date(interview.interviewTimestamp).toLocaleString();
      const emailText = `
        The interview details have been updated.
        New Meet Details: ${meetDetails}
        New Interview Timing: ${formattedTime}
      `;

      await sendEmail(user.email, 'Interview Updated', emailText);
      await sendEmail(employee.email, 'Interview Updated', emailText);
    }

    res.json({ message: 'Interview updated successfully', interview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete an interview
const deleteInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findByIdAndDelete(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Find user and employee
    const user = await User.findById(interview.userId);
    const employee = await User.findById(interview.employeeId);

    if (user && employee) {
      const emailText = `
        The interview scheduled for the job has been cancelled.
        Previous Interview Timing: ${new Date(interview.interviewTimestamp).toLocaleString()}
      `;

      await sendEmail(user.email, 'Interview Cancelled', emailText);
      await sendEmail(employee.email, 'Interview Cancelled', emailText);
    }

    res.json({ message: 'Interview deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get interview by ID
const getInterviewById = async (req, res) => {
  try {
      const { interviewId } = req.params;

      // Fetch interview details
      const interview = await Interview.findById(interviewId);
      if (!interview) {
          return res.status(404).json({ message: 'Interview not found' });
      }

      // Fetch user details
      const user = await User.findById(interview.userId, 'name email');

      // Fetch job details (try Job first, then FreeJob)
      let job = await Job.findById(interview.postId, 'jobTitle jobType');
      if (!job) {
          job = await FreeJob.findById(interview.postId, 'jobTitle jobType');
      }

      // Construct response
      const response = {
          interview,
          user: user || { name: 'Unknown', email: 'Unknown' },
          job: job || { jobTitle: 'Not Found', jobType: 'Not Found' }
      };

      res.json(response);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

  
 // Get interviews by userId
const getInterviewsByUserId = async (req, res) => {
  try {
      const { userId } = req.params;

      // Fetch all interviews for the given user
      const interviews = await Interview.find({ userId });

      if (!interviews.length) {
          return res.status(404).json({ message: 'No interviews found for this user' });
      }

      // Fetch job and employee details for each interview
      const interviewsWithDetails = await Promise.all(
          interviews.map(async (interview) => {
              // Fetch employee details using employeeId from interview
              const employee = await User.findById(interview.employeeId, 'companyContactPerson.name companyContactPerson.officialEmail');

              // Fetch job details
              let job = await Job.findById(interview.postId, 'jobTitle jobType');
              if (!job) {
                  job = await FreeJob.findById(interview.postId, 'jobTitle jobType');
              }

              return {
                  interview,
                  employee: employee || { name: 'Unknown', email: 'Unknown' },
                  job: job || { jobTitle: 'Not Found', jobType: 'Not Found' }
              };
          })
      );

      res.json(interviewsWithDetails);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

// Get interviews by employeeId
const getInterviewsByEmployeeId = async (req, res) => {
  try {
      const { employeeId } = req.params;

      // Fetch all interviews for the given employee
      const interviews = await Interview.find({ employeeId });

      if (!interviews.length) {
          return res.status(404).json({ message: 'No interviews found for this employee' });
      }

      // Fetch job and user details for each interview
      const interviewsWithDetails = await Promise.all(
          interviews.map(async (interview) => {
              // Fetch user details using userId from interview
              const user = await User.findById(interview.userId, 'name email');

              // Fetch job details
              let job = await Job.findById(interview.postId, 'jobTitle jobType');
              if (!job) {
                  job = await FreeJob.findById(interview.postId, 'jobTitle jobType');
              }

              return {
                  interview,
                  user: user || { name: 'Unknown', email: 'Unknown' },
                  job: job || { jobTitle: 'Not Found', jobType: 'Not Found' }
              };
          })
      );

      res.json(interviewsWithDetails);
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