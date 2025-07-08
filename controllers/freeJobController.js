const FreeJob = require('../models/freeJobModel');
const Plan = require('../models/planModel'); // Ensure Plan model is imported
const User = require('../models/userModel');
const admin = require('../config/firebase');

// Get all free jobs
const getAllFreeJobs = async (req, res) => {
  try {
    const freeJobs = await FreeJob.find();
    res.status(200).json({ success: true, data: freeJobs });
  } catch (error) {
    console.error('Error fetching free jobs:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Post a free job
const postFreeJob = async (req, res) => {
  const jobData = req.body;

  // Required fields
  const requiredFields = [
    'jobTitle', 'jobCategory', 'jobDescription', 'email', 'username', 'specialisms',
    'jobType', 'keyResponsibilities', 'skillsAndExperience', 'offeredSalary', 'careerLevel', 
    'experienceYears', 'experienceMonths', 'gender', 'industry', 'qualification', 
    'applicationDeadlineDate', 'country', 'city', 'completeAddress', 'user_id', 
    'plan_id', 'employmentStatus', 'vacancies', 'companyName'
  ];

  // Check for missing fields
  for (const field of requiredFields) {
    if (!jobData[field]) {
      return res.status(400).json({ success: false, error: `Field ${field} is required` });
    }
  }

  try {
    // Fetch the associated plan
    const plan = await Plan.findById(jobData.plan_id);
    if (!plan) {
      return res.status(400).json({ success: false, error: 'Invalid plan_id' });
    }

    // Check for available free jobs
    if (plan.free_jobs <= 0) {
      return res.status(400).json({ success: false, error: 'No free jobs available in the selected plan' });
    }

    // Create and save the new free job
    const job = new FreeJob({ ...jobData, specialisms: jobData.specialisms });
    await job.save();

    // Decrement the plan's free jobs
    plan.free_jobs -= 1;
    await plan.save();

    // 🔥 Fetch candidates with valid device tokens
    const candidates = await User.find({
      role: 'candidate',
      deviceToken: { $exists: true, $ne: '' }
    }).select('deviceToken');
    
    if (candidates.length === 0) {
      console.warn('No valid candidate device tokens found.');
    } else {
      const messageTemplate = {
        notification: {
          title: 'New Job Alert!',
          body: `${job.jobTitle} at ${job.companyName}`,
        },
        data: {
          jobId: job._id.toString(),
          jobType: job.jobType || '',
        },
      };

      // 🔁 Send one-by-one
      for (const candidate of candidates) {
        try {
          await admin.messaging().send({
            token: candidate.deviceToken,
            ...messageTemplate,
          });
        } catch (err) {
          console.error(`❌ Failed for ${candidate.deviceToken}: ${err.message}`);
        }
      }
    }

    res.status(201).json({ success: true, message: 'Free job posted successfully', data: job });
  } catch (error) {
    console.error('Error posting free job:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = { getAllFreeJobs, postFreeJob };
