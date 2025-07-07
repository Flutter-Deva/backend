const ArchivedFreeJob = require('../models/archivedFreeJobModel');

const getAllArchivedFreeJobs = async (req, res) => {
  try {
    const archivedFreeJobs = await ArchivedFreeJob.find(); // Retrieve all users

    res.status(200).json(archivedFreeJobs);
  } catch (error) {
    console.error('Error fetching archivedFreeJobs:', error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllArchivedFreeJobs };
