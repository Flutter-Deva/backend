const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendNotification = (email, job,username) => {
  // Log job details for debugging
  console.log('Sending email with job details:', job);

  const message = `
    Hello ${username},
    Job Title: ${job.jobTitle || 'Not provided'}
    Company: ${job.companyName || 'Not provided'}
    Description: ${job.jobDescription || 'Not provided'}
    Experience Required: ${job.experienceYears || 0} years ${job.experienceMonths || 0} months
    Apply Here: [Job Application Link]
  `;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'New Job Posted',
    text: message,
  };

  // Return a promise
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`Error sending email to ${email}:`, error);
        reject(error); // Reject the promise on error
      } else {
        console.log(`Email sent to ${email}:`, info.response);
        resolve(info); // Resolve the promise on success
      }
    });
  });
};

module.exports = sendNotification;