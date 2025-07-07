const ArchivedJob = require('../models/archivedJobModel');

const getAllArchivedJobs = async (req, res) => {
  try {
    const archivedJobs = await ArchivedJob.find(); // Retrieve all users

    res.status(200).json(archivedJobs);
  } catch (error) {
    console.error('Error fetching archivedJobs:', error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllArchivedJobs };
