const Experience = require('../models/experienceModel');

// Get all experiences
const getAllExperiences = async (req, res) => {
  try {
    const experiences = await Experience.find();
    res.status(200).json({ success: true, data: experiences });
  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get a specific experience by user_id
const getExperienceByUserId = async (req, res) => {
  const { id } = req.params;
  try {
    const experience = await Experience.findOne({ user_id: id });
    if (!experience) {
      return res.status(404).json({ success: false, error: 'No such experience record exists' });
    }
    res.status(200).json({ success: true, data: experience });
  } catch (error) {
    console.error('Error fetching experience record:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Create a new experience
const createExperience = async (req, res) => {
  const { title, company, year, description, user_id } = req.body; // Expecting user_id in body
  try {
    const newExperience = new Experience({
      title,
      company,
      year,
      description,
      user_id, // Using user_id from request body
    });
    const savedExperience = await newExperience.save();
    res.status(201).json({ success: true, data: savedExperience });
  } catch (error) {
    console.error('Error creating experience:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Update an experience
const updateExperience = async (req, res) => {
  const { title, company, year, description } = req.body;
  const { id } = req.params;

  try {
    const updatedExperience = await Experience.findOneAndUpdate(
      { _id: id, user_id: req.body.user_id }, // Expecting user_id in body
      { title, company, year, description },
      { new: true } // Return updated document
    );
    if (!updatedExperience) {
      return res.status(404).json({ success: false, error: 'Experience not found or not authorized' });
    }
    res.status(200).json({ success: true, data: updatedExperience });
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// Delete an experience
const deleteExperience = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body; // Expecting user_id in body

  try {
    const deletedExperience = await Experience.findOneAndDelete({
      _id: id,
      user_id, // Ensure user ownership by user_id
    });
    if (!deletedExperience) {
      return res.status(404).json({ success: false, error: 'Experience not found or not authorized' });
    }
    res.status(200).json({ success: true, message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getAllExperiences,
  getExperienceByUserId,
  createExperience,
  updateExperience,
  deleteExperience,
};
