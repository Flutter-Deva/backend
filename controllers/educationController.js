const Education = require('../models/educationModel');

// Get all educations
const getAllEducations = async (req, res) => {
  try {
    const educations = await Education.find(); // Retrieve all education records
    res.status(200).json({ success: true, data: educations });
  } catch (error) {
    console.error('Error fetching educations:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get a specific education record by ID
const getEducationById = async (req, res) => {
  const { id } = req.params;
  try {
    const education = await Education.findOne({ _id: id });

    if (education) {
      res.status(200).json({ success: true, data: education });
    } else {
      res.status(404).json({ success: false, error: 'No such education record found' });
    }
  } catch (error) {
    console.error('Error fetching education record:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Add a new education record
const createEducation = async (req, res) => {
  const { course, institution, startDate, endDate, user_id } = req.body;

  try {
    const newEducation = new Education({ course, institution, startDate, endDate, user_id });
    await newEducation.save();
    res.status(201).json({ success: true, data: newEducation });
  } catch (error) {
    console.error('Error saving education:', error);
    res.status(400).json({ success: false, error: 'Failed to add education. Please try again.' });
  }
};

// Update an existing education record
const updateEducation = async (req, res) => {
  const { course, institution, startDate, endDate } = req.body;
  const { id } = req.params;

  try {
    const updatedEducation = await Education.findOneAndUpdate(
      { _id: id, user_id: req.body.user_id }, // Check that the user_id matches
      { course, institution, startDate, endDate },
      { new: true }
    );

    if (!updatedEducation) {
      return res.status(404).json({ success: false, error: 'Education not found or not authorized' });
    }

    res.status(200).json({ success: true, data: updatedEducation });
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete an education record
const deleteEducation = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body; // Expecting user_id in body for authorization

  try {
    const deletedEducation = await Education.findOneAndDelete({ _id: id, user_id });

    if (!deletedEducation) {
      return res.status(404).json({ success: false, error: 'Education not found or not authorized' });
    }

    res.status(200).json({ success: true, message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Error deleting education:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getAllEducations,
  getEducationById,
  createEducation,
  updateEducation,
  deleteEducation,
};
