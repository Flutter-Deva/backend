const Login = require('../models/loginModel');

// Get all login records
const getAllLogins = async (req, res) => {
  try {
    const logins = await Login.find(); // Retrieve all login records
    res.status(200).json(logins);
  } catch (error) {
    console.error('Error fetching logins:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get the second last login info for a user
const getSecondLastLoginInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const login = await Login.findOne({ userId: id });

    if (!login || login.loginfo.length < 2) {
      // Handle the case where there are fewer than two login records
      return res.status(200).json({ secondLastLoginInfo: null });
    }

    const secondLastLoginInfo = login.loginfo[login.loginfo.length - 2];
    res.status(200).json({ secondLastLoginInfo });
  } catch (error) {
    console.error('Error fetching login information:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllLogins,
  getSecondLastLoginInfo,
};
