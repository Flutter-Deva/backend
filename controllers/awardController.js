const Award = require('../models/awardModel');

// Get all awards
const getAllAwards = async (req, res) => {
  try {
    const awards = await Award.find(); // Retrieve all awards
    res.status(200).json({ success: true, data: awards });
  } catch (error) {
    console.error('Error fetching awards:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Get award by ID
const getAwardById = async (req, res) => {
  const { id } = req.params;
  try {
    const award = await Award.findById(id);
    if (!award) {
      return res.status(404).json({ success: false, error: 'Award not found' });
    }
    res.status(200).json({ success: true, data: award });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// Create a new award
const createAward = async (req, res) => {
  const { title, organization, year, description, user_id } = req.body; // Expecting user_id in body
  try {
    const newAward = new Award({
      title,
      organization,
      year,
      description,
      user_id, // Using user_id from request body
    });
    const savedAward = await newAward.save();
    res.status(201).json({ success: true, data: savedAward });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update an award
const updateAward = async (req, res) => {
  const { title, organization, year, description } = req.body;
  const { id } = req.params;

  try {
    const updatedAward = await Award.findByIdAndUpdate(
      { _id: id, user_id: req.body.user_id }, // Expecting user_id in body for authorization
      { title, organization, year, description },
      { new: true } // Return updated document
    );
    if (!updatedAward) {
      return res.status(404).json({ success: false, error: 'Award not found or not authorized' });
    }
    res.status(200).json({ success: true, data: updatedAward });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete an award
const deleteAward = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body; // Expecting user_id in body for authorization

  try {
    const deletedAward = await Award.findByIdAndDelete({
      _id: id,
      user_id, // Ensure user ownership by user_id
    });
    if (!deletedAward) {
      return res.status(404).json({ success: false, error: 'Award not found or not authorized' });
    }
    res.status(200).json({ success: true, message: 'Award deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

module.exports = {
  getAllAwards,
  getAwardById,
  createAward,
  updateAward,
  deleteAward,
};
