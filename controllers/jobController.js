const Job = require('../models/jobModel');
const User = require('../models/userModel'); 
const FreeJob = require('../models/freeJobModel'); // Assuming FreeJob model exists
const Skill = require('../models/skillModel'); // Assuming Skill model exists
const Education = require('../models/educationModel'); // Assuming Education model exists
const Experience = require('../models/experienceModel'); // Assuming Experience model exists
const Award = require('../models/awardModel'); // Assuming Award model exists
const Plan = require('../models/planModel'); // Assuming Plan model exists
const fs = require('fs');
const path = require('path');

// Log file setup
const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'app.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Function to log messages to file
const logToFile = (message) => {
  fs.appendFile(logFile, `${new Date().toISOString()} - ${message}\n`, (err) => {
    if (err) {
      console.error(`Failed to write log: ${err.message}`);
    }
  });
};

// Fetch all jobs
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: "Server error" });
  }
};
//function to get Job Count
const getAllJobsCount = async (req, res) => {
  try {
    const jobCount = await Job.countDocuments(); // Total job count retrieve kar raha hai
    res.status(200).json({ total_jobs: jobCount });
  } catch (error) {
    console.error('Error fetching job count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Post a new job
const postJob = async (req, res) => {
  const jobData = req.body;

  // List of required fields
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
      return res.status(400).json({ error: `Field ${field} is required` });
    }
  }

  try {
    // Validate the selected plan
    const plan = await Plan.findById(jobData.plan_id);
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan_id' });
    }

    // Check if the plan allows posting paid jobs
    if (plan.paid_jobs <= 0) {
      return res.status(400).json({ error: 'No paid jobs available in the selected plan' });
    }

    // Create and save the new job
    const job = new Job({
      ...jobData,
      specialisms: jobData.specialisms,
      keyResponsibilities: jobData.keyResponsibilities,
      skillsAndExperience: jobData.skillsAndExperience,
    });

    await job.save();
    plan.paid_jobs -= 1; // Decrement paid job count
    await plan.save();

    res.status(201).json({ message: 'Paid job posted successfully', job });
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Fetch shortlisted jobs for a user by ID
const getShortlistedJobsById = async (req, res) => {
  const { id } = req.params;

  try {
    let jobs = await Job.find();
    let freeJobs = await FreeJob.find();
    let allJobs = [...jobs, ...freeJobs];

    const user = await User.findById(id);
    const userSkills = await Skill.find({ userId: id }).exec();
    const userSkillsNames = userSkills.map(skill => skill.skillName);

    const education = await Education.find({ user_id: id });
    const experience = await Experience.find({ user_id: id });
    const awards = await Award.find({ user_id: id });

    const matchedJobs = allJobs.map(job => {
      const matchedSkills = job.specialisms.filter(specialism => userSkillsNames.includes(specialism));
      const matchedQualifications = job.qualification && education.some(ed => ed.course === job.qualification);
      const matchedExperience = job.skillsAndExperience && experience.some(exp => exp.title === job.skillsAndExperience[0]);
      const matchedAwards = job.skillsAndExperience && awards.some(award => job.skillsAndExperience.includes(award.title));

      const isMatched = matchedSkills.length > 0 || matchedQualifications || matchedExperience || matchedAwards;

      if (isMatched) {
        return {
          ...job._doc,
          matchedSkills: matchedSkills.length > 0 ? matchedSkills : "No skills matched",
          matchedQualifications: matchedQualifications ? "Matched Qualification" : "No matching qualification",
          matchedExperience: matchedExperience ? "Matched Experience" : "No matching experience",
          matchedAwards: matchedAwards ? "Matched Award" : "No matching awards"
        };
      }

      return null;
    }).filter(job => job !== null);

    res.status(200).json(matchedJobs);
  } catch (error) {
    console.error('Error fetching shortlisted jobs:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Find jobs by user ID, matching on skills, qualifications, experience, awards, and location
const findJobsByUserId = async (req, res) => {
  const { id } = req.params;

  try {
    let jobs = await Job.find();
    let freeJobs = await FreeJob.find();
    let allJobs = [...jobs, ...freeJobs];

    const user = await User.findById(id);
    const userSkills = await Skill.find({ userId: id }).exec();
    const userSkillsNames = userSkills.map(skill => skill.skillName);

    const education = await Education.find({ user_id: id });
    const experience = await Experience.find({ user_id: id });
    const awards = await Award.find({ user_id: id });

    const userCountry = user.country;
    const userCity = user.address.split(',')[0].trim();

    const matchedJobs = [];
    const unmatchedJobs = [];

    allJobs.forEach(job => {
      const matchedSkills = job.specialisms.filter(specialism => userSkillsNames.includes(specialism));
      const matchedQualifications = job.qualification && education.some(ed => ed.course === job.qualification);
      const matchedExperience = job.skillsAndExperience && experience.some(exp => exp.title === job.skillsAndExperience[0]);
      const matchedAwards = job.skillsAndExperience && awards.some(award => job.skillsAndExperience.includes(award.title));
      const matchedLocation = job.city === userCity || job.country === userCountry;

      const isMatched = matchedSkills.length > 0 || matchedQualifications || matchedExperience || matchedAwards || matchedLocation;

      if (isMatched) {
        matchedJobs.push({
          ...job._doc,
          matchedSkills: matchedSkills.length > 0 ? matchedSkills : "No skills matched",
          matchedQualifications: matchedQualifications ? "Matched Qualification" : "No matching qualification",
          matchedExperience: matchedExperience ? "Matched Experience" : "No matching experience",
          matchedAwards: matchedAwards ? "Matched Award" : "No matching awards",
          matchedLocation: matchedLocation ? "Matched Location" : "No matching location"
        });
      } else {
        unmatchedJobs.push(job);
      }
    });

    res.status(200).json({
      matchedJobs,
      unmatchedJobs
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch job count by user ID
const getJobCountByUserId = async (req, res) => {
  const { id } = req.params;

  try {
    const jobCount = await Job.countDocuments({ user_id: id });
    res.status(200).json({ user_id: id, jobCount });
  } catch (error) {
    console.error('Error fetching job count:', error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllJobs,
  postJob,
  getShortlistedJobsById,
  getAllJobsCount,
  findJobsByUserId,
  getJobCountByUserId
};
