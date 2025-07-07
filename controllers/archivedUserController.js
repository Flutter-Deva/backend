const ArchivedUser = require('../models/archivedUserModel');

const getAllArchivedUsers = async (req, res) => {
  try {
    const archivedUsers = await ArchivedUser.find(); // Retrieve all users

    res.status(200).json(archivedUsers);
  } catch (error) {
    console.error('Error fetching archivedJobs:', error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllArchivedUsers };
