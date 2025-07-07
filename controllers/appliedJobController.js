const AppliedJob = require('../models/appliedJobModel');
const User = require('../models/userModel');
const Job = require('../models/jobModel');
const mongoose = require('mongoose');
const FreeJob = require('../models/freeJobModel');
const Plan = require('../models/planModel');
const { sendEmail } = require('../utils/sendEmail'); // Importing sendEmail
console.log('sendEmail function:', sendEmail);


const getApplicationUsingPostId = async (req, res) => {
  const { post_id } = req.params;

  if (!post_id) {
    return res.status(400).json({ message: 'Post_id is required' });
  }

  try {
    // Fetch applications based on post_id
    const applications = await AppliedJob.find({ post_id });

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No applications found for the specified post_id' });
    }

    // Enrich applications with user details and job details
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        // Fetch user details
        const user = await User.findById(app.user_id).select('name email');

        // Fetch job details first from Job model
        let job = await Job.findOne({ _id: app.post_id }).select('jobTitle jobType');

        // If job not found in Job model, check in FreeJob model
        if (!job) {
          job = await FreeJob.findOne({ _id: app.post_id }).select('jobTitle jobType');
        }

        return {
          _id: app.id,
          post_id: app.post_id,
          user_id: app.user_id,
          plan_id: app.plan_id,
          name: user?.name || 'N/A',
          email: user?.email || 'N/A',
          jobTitle: job?.jobTitle || 'N/A',
          jobType: job?.jobType || 'N/A',
          seen: app.seen,
          timestamp: app.timestamp,
          status: app.__v, // Renaming __v to label
        };
      })
    );

    res.status(200).json(enrichedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//get applicants count using  postid
const getApplicationCountUsingUserId = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    // Count applications directly using user_id
    const applicationCount = await AppliedJob.countDocuments({ user_id });

    console.log("Total Applications for user_id:", user_id, "=>", applicationCount); // ✅ Debugging

    if (applicationCount === 0) {
      return res.status(404).json({ message: 'No applications found for the specified user_id' });
    }

    res.status(200).json({ totalApplications: applicationCount });
  } catch (error) {
    console.error('Error fetching application count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


const getApplicationUsingUserId = async (req, res) => {
  const { user_id } = req.params;
  
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  
  try {
    // Fetch applications based on user_id
    const applications = await AppliedJob.find({ user_id });

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No applications found for the specified user_id' });
    }

    // Enrich applications with user details and job details
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        // Fetch user details
        const user = await User.findById(app.user_id).select('name email');

        // Fetch job details first from Job model
        let job = await Job.findOne({ _id: app.post_id }).select('jobTitle jobType');

        // If job not found in Job model, check in FreeJob model
        if (!job) {
          job = await FreeJob.findOne({ _id: app.post_id }).select('jobTitle jobType');
        }

        return {
          _id: app.id,
          post_id: app.post_id,
          user_id: app.user_id,
          plan_id: app.plan_id,
          name: user?.name || 'N/A',
          email: user?.email || 'N/A',
          jobTitle: job?.jobTitle || 'N/A',
          jobType: job?.jobType || 'N/A',
          seen: app.seen,
          timestamp: app.timestamp,
          status: app.__v, // Renaming __v to label
        };
      })
    );

    res.status(200).json(enrichedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//fetch employer specific posted jobs
const getJobsByUserId = async (req, res) => {
  const { user_id } = req.params;
  try {
    // Fetch jobs from both Job and FreeJob collections concurrently
    const [jobs, freeJobs] = await Promise.all([
      Job.find({ user_id }),
      FreeJob.find({ user_id }),
    ]);
    // Combine the results from both collections
    const allJobs = [...jobs, ...freeJobs];
    // Add the label 'Paid Job' or 'Free Job' for each job based on its collection
    const jobsWithLabel = allJobs.map(job => {
      const jobType = job.constructor.modelName === 'Job' ? 'Paid Job' : 'Free Job';
      return {
        ...job._doc,  // Spread the job's original data
        label: jobType  // Add the Paid/Free Job label
      };
    });
    // If there are jobs, return them; otherwise, return 404
    if (jobsWithLabel.length > 0) {
      res.status(200).json(jobsWithLabel);
    } else {
      res.status(404).json({ message: "No jobs found for this user" });
    }
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller function to get all applied jobs
const getAllAppliedJobs = async (req, res) => {
  try {
    const appliedJob = await AppliedJob.find(); // Retrieve all applied jobs
    res.status(200).json(appliedJob);
  } catch (error) {
    console.error('Error fetching appliedJobs:', error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAppliedJobsCount = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).send({ message: 'User ID is required' });
  }

  try {
    const applications = await AppliedJob.find({ user_id });

    res.status(200).json({
      user_id,
      applied_jobs_count: applications.length,
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to validate user and post IDs
const validateIds = async (req, res) => {
  const { user_id, post_id } = req.body;

  if (!user_id || !post_id) {
    return res.status(400).json({ error: 'user_id and post_id are required' });
  }

  try {
    // Check if there is a record with the given user_id and post_id
    const record = await AppliedJob.findOne({ user_id, post_id });

    if (record) {
      return res.status(200).json({ valid: true });
    } else {
      return res.status(404).json({ valid: false });
    }
  } catch (error) {
    console.error('Error checking IDs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Endpoint to get all applied jobs with additional information
const getAllAppliedJobsWithDetails = async (req, res) => {
  try {
    const appliedJobs = await AppliedJob.find();
    const userIds = appliedJobs.map(job => job.user_id);
    const postIds = appliedJobs.map(job => job.post_id);

    const [users, jobs, freeJobs] = await Promise.all([
      User.find({ '_id': { $in: userIds } }),
      Job.find({ '_id': { $in: postIds } }),
      FreeJob.find({ '_id': { $in: postIds } })
    ]);

    const jobPosterIds = jobs.map(job => job.user_id);
    const jobPosters = await User.find({ '_id': { $in: jobPosterIds } });

    const usersMap = users.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});

    const jobsMap = jobs.reduce((map, job) => {
      map[job._id] = job;
      return map;
    }, {});

    const freeJobsMap = freeJobs.reduce((map, freeJob) => {
      map[freeJob._id] = freeJob;
      return map;
    }, {});

    const jobPostersMap = jobPosters.reduce((map, poster) => {
      map[poster._id] = poster;
      return map;
    }, {});

    const consolidatedData = appliedJobs.map(appliedJob => {
      const user = usersMap[appliedJob.user_id];
      let job = jobsMap[appliedJob.post_id] || freeJobsMap[appliedJob.post_id];
      let posterDetails = null;

      if (job && jobsMap[appliedJob.post_id]) {
        const poster = jobPostersMap[jobsMap[appliedJob.post_id].user_id];
        if (poster) {
          posterDetails = {
            email: poster.email,
            name: poster.name,
          };
        }
      }

      return {
        appliedJobId: appliedJob._id,
        seen: appliedJob.seen,
        timestamp: appliedJob.timestamp,
        status: appliedJob.__v,
        applicant: {
          id: user?._id,
          name: user?.name,
          email: user?.email,
        },
        job: job
          ? {
              id: job._id,
              title: job.jobTitle,
              description: job.jobDescription,
              salary: job.offeredSalary,
              companyName: job.companyName,
              location: {
                city: job.city,
                country: job.country,
              },
              poster: posterDetails,
            }
          : null,
      };
    });

    res.status(200).json(consolidatedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Endpoint to update the seen/unseen status for applied jobs
const updateSeenStatus = async (req, res) => {
  const { post_id } = req.body;

  if (!post_id) {
    return res.status(400).json({ error: 'post_id is required' });
  }

  try {
    const record = await AppliedJob.findOne({ post_id });

    if (record) {
      record.seen = true;
      await record.save();
      return res.status(200).json({ valid: true, message: 'Seen status updated' });
    } else {
      return res.status(404).json({ valid: false, message: 'Record not found' });
    }
  } catch (error) {
    console.error('Error updating seen status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Endpoint to delete an applied job
const deleteAppliedJob = async (req, res) => {
  const { user_id, post_id } = req.body;

  if (!user_id || !post_id) {
    return res.status(400).json({ error: 'user_id and post_id are required' });
  }

  try {
    const existingApplication = await AppliedJob.findOne({ user_id, post_id });

    if (!existingApplication) {
      return res.status(400).json({ error: 'No application found for this job' });
    }

    const planId = existingApplication.plan_id;

    if (!planId) {
      await AppliedJob.deleteOne({ user_id, post_id });
      return res.status(200).json({ message: 'Job application withdrawn successfully' });
    }

    const selectedPlan = await Plan.findById(planId);
    if (!selectedPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const applicationTimestamp = existingApplication.timestamp;
    const currentTimestamp = new Date();
    const timeDifference = currentTimestamp - new Date(applicationTimestamp);

    const isWithin10Minutes = timeDifference <= 600000;

    if (isWithin10Minutes) {
      let job = await Job.findById(post_id);
      let isPaidJob = true;
      if (!job) {
        job = await FreeJob.findById(post_id);
        isPaidJob = false;
      }

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (isPaidJob && selectedPlan.apply_paid_jobs <= 0) {
        return res.status(400).json({ error: 'Cannot reduce paid job applications further' });
      } else if (!isPaidJob && selectedPlan.apply_free_jobs <= 0) {
        return res.status(400).json({ error: 'Cannot reduce free job applications further' });
      }

      if (isPaidJob) {
        selectedPlan.apply_paid_jobs += 1;
      } else {
        selectedPlan.apply_free_jobs += 1;
      }

      await selectedPlan.save();
    }

    await AppliedJob.deleteOne({ user_id, post_id });
    return res.status(200).json({ message: 'Job application withdrawn successfully' });
  } catch (error) {
    console.error('Error withdrawing job application:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Endpoint to apply for a job
// Inside the applyForJob function
const applyForJob = async (req, res) => {
  const { user_id, post_id } = req.body;

  if (!user_id || !post_id) {
    return res.status(400).json({ error: 'user_id and post_id are required' });
  }

  const userId = user_id;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(post_id)) {
      return res.status(400).json({ error: 'Invalid user_id or post_id' });
    }

    const userPlans = await Plan.find({ user_id: userId });

    if (!userPlans || userPlans.length === 0) {
      return res.status(400).json({ error: 'User does not have any active plans' });
    }

    let job = await Job.findById(post_id);
    let isPaidJob = true;
    if (!job) {
      job = await FreeJob.findById(post_id);
      isPaidJob = false;
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    let selectedPlan = null;
    let applyPaidJobs = 0;
    let applyFreeJobs = 0;

    for (let plan of userPlans) {
      const currentDate = new Date();
      if (plan.start_date <= currentDate && plan.end_date >= currentDate) {
        applyPaidJobs = plan.apply_paid_jobs || 0;
        applyFreeJobs = plan.apply_free_jobs || 0;

        if (isPaidJob && applyPaidJobs > 0) {
          selectedPlan = plan;
          break;
        } else if (!isPaidJob && applyFreeJobs > 0) {
          selectedPlan = plan;
          break;
        }
      }
    }

    if (!selectedPlan) {
      return res.status(400).json({ error: 'User does not have sufficient plan balance' });
    }

    await AppliedJob.create({ user_id: userId, post_id });

    if (isPaidJob) {
      selectedPlan.apply_paid_jobs -= 1;
    } else {
      selectedPlan.apply_free_jobs -= 1;
    }

    await selectedPlan.save();

    // Send a confirmation email to the applicant
    const applicant = await User.findById(userId);
    if (applicant) {
     console.log('Sending email to:', applicant.email);
      await sendEmail(applicant.email, 'Job Application Confirmation', 'Your application was successful!');
    }

    res.status(200).json({ message: 'Job application successful' });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: 'Error applying for job', error: error.message });
  }
};

const getAppliedJobsById = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).send({ message: 'User ID is required' });
  }

  try {
    const applications = await AppliedJob.find({ user_id });

    res.status(200).json(
      
     applications
);

  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//Shortlisting status
/*const updateJobsStatus = async (id, action) => {
  try {
    const appliedJob = await AppliedJob.findById(id);
    if (!appliedJob) {
      return { status: 404, message: "Applied job not found" };
    }

    const job = await Job.findById(appliedJob.post_id) || await FreeJob.findById(appliedJob.post_id);
    if (!job) {
      return { status: 404, message: "Job not found" };
    }

    if (action === 'approve') {
      appliedJob.__v = 1;
    } else if (action === 'disapprove') {
      appliedJob.__v = -1;
    } else {
      return { status: 400, message: "Invalid action" };
    }

    await appliedJob.save();

    const applicant = await User.findById(appliedJob.user_id);
    if (!applicant) {
      return { status: 404, message: "Applicant not found" };
    }

    let subject = action === 'approve'
      ? `Application for ${job.jobTitle} Approved`
      : `Application for ${job.jobTitle} Rejected`;

    let htmlMessage = action === 'approve'
      ? `<h2>Congratulations ${applicant.name},</h2>
         <p>Your application for the job <strong>${job.jobTitle}</strong> has been approved!</p>
         <p>We will contact you shortly with more details.</p>
         <p>Best regards,<br>Hiring Team</p>`
      : `<h2>Hello ${applicant.name},</h2>
         <p>We regret to inform you that your application for the job <strong>${job.jobTitle}</strong> has been rejected.</p>
         <p>We encourage you to apply for other opportunities in the future.</p>
         <p>Best regards,<br>Hiring Team</p>`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: applicant.email,
      subject,
      html: htmlMessage,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${applicant.email}`);
    } catch (emailError) {
      console.error(`Error sending email to ${applicant.email}:`, emailError);
    }

    return { status: 200, message: "Applied job status updated successfully", appliedJob };
  } catch (error) {
    console.error('Error updating applied job status:', error);
    return { status: 500, message: "Server error" };
  }
};
*/
const updateJobStatus = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid candidate ID format" });
  }

  try {
    const appliedJob = await AppliedJob.findById(id);
    if (!appliedJob) {
      return res.status(404).json({ message: "Applied job not found" });
    }

    if (action === 'approve') {
      appliedJob.__v = 1;
    } else if (action === 'disapprove') {
      appliedJob.__v = -1;
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await appliedJob.save();
    console.log("Updated Job Status:", appliedJob); // ✅ Debugging

    return res.status(200).json({ message: "Candidate shortlisted successfully" });
  } catch (error) {
    console.error("Error updating job status:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// get shortlisted candidates
const getShortlistedCandidates = async (req, res) => {
  const { user_id } = req.params;

  console.log("Fetching Shortlisted Candidates for employer_id:", user_id);

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    // Step 1: Fetch all jobs posted by this employer
    const jobs = await Job.find({ user_id }).select('_id');
    const jobIds = jobs.map(job => job._id);

    console.log("Jobs Posted by Employer:", jobIds); // ✅ Debugging

    if (jobIds.length === 0) {
      return res.status(404).json({ message: 'No jobs found for this employer' });
    }

    // Step 2: Find all shortlisted candidates for these jobs
    const applications = await AppliedJob.find({ post_id: { $in: jobIds }, __v: 1 });

    console.log("Shortlisted Candidates Found:", applications); // ✅ Debugging

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No shortlisted candidates found for this employer' });
    }

    // Step 3: Fetch user and job details
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const user = await User.findById(app.user_id).select('name email');
        let job = await Job.findById(app.post_id).select('jobTitle jobType');

        if (!job) {
          job = await FreeJob.findById(app.post_id).select('jobTitle jobType');
        }

        return {
          _id: app._id,
          post_id: app.post_id,
          user_id: app.user_id,
          name: user?.name || 'N/A', // ✅ Add Candidate Name
          email: user?.email || 'N/A',
          jobTitle: job?.jobTitle || 'N/A', // ✅ Add Job Title
          jobType: job?.jobType || 'N/A', // ✅ Add Job Type
          seen: app.seen,
          timestamp: app.timestamp,
          status: app.__v, // 1 means shortlisted
        };
      })
    );

    res.status(200).json(enrichedApplications);
  } catch (error) {
    console.error('Error fetching shortlisted applications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//Get count of shortlisted candidates for specific employer based on userid
const getShortlistedCandidatesCount = async (req, res) => {
  const { user_id } = req.params;

  console.log("Fetching Shortlisted Candidates Count for employer_id:", user_id);

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    // Step 1: Fetch all jobs posted by this employer
    const jobIds = await Job.find({ user_id }).distinct('_id');

    if (jobIds.length === 0) {
      return res.status(404).json({ message: 'No jobs found for this employer' });
    }

    // Step 2: Get count of shortlisted candidates for these jobs
    const shortlistedCount = await AppliedJob.countDocuments({
      post_id: { $in: jobIds },
      __v: 1, // Shortlisted candidates
    });

    console.log("Total Shortlisted Candidates:", shortlistedCount); // ✅ Debugging

    res.status(200).json({ totalShortlisted: shortlistedCount });
  } catch (error) {
    console.error('Error fetching shortlisted count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getApplicationUsingPostIdCount = async (req, res) => {
  const { post_id } = req.params;

  if (!post_id) {
    return res.status(400).json({ message: 'Post_id is required' });
  }

  try {
    // Fetch applications based on post_id
    const applications = await AppliedJob.find({ post_id });

    if (applications.length === 0) {
      return res.status(404).json({ message: 'No applications found for the specified post_id' });
    }
    
    res.status(200).json(applications.length)
} catch (error) {
    console.error('Error fetching applications count', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Exporting the functions to be used in your routes
module.exports = {
  getAllAppliedJobs,
  validateIds,
  getAllAppliedJobsWithDetails,
  updateSeenStatus,
  deleteAppliedJob,
  applyForJob,
  getAppliedJobsCount,
  getAppliedJobsById,
  getJobsByUserId,
  getApplicationUsingPostId,
  getApplicationUsingUserId,
  updateJobStatus,
  getShortlistedCandidates,
  getShortlistedCandidatesCount,
  getApplicationCountUsingUserId,
  getApplicationUsingPostIdCount
  //updateJobsStatus
};
