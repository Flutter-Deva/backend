const Skill = require('../models/skillModel');

// Function to get all skills
const getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find();
    res.status(200).json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to get skills by user ID
const getSkillsByUserId = async (req, res) => {
  try {
    const { id } = req.params;
    const skills = await Skill.find({ userId: id });
    res.status(200).json(skills);
  } catch (error) {
    console.error('Error fetching skills by user ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to add a new skill
const addSkill = async (req, res) => {
  try {
    const { skillName, knowledgeLevel, experienceWeeks, userId } = req.body;

    // Validate required fields
    if (!skillName || !knowledgeLevel || !experienceWeeks || !userId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Validate knowledge level
    const validKnowledgeLevels = ['basic', 'intermediate', 'advanced'];
    if (!validKnowledgeLevels.includes(knowledgeLevel.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid knowledge level.' });
    }

    // Create a new skill
    const newSkill = new Skill({
      skillName,
      knowledgeLevel: knowledgeLevel.toLowerCase(),
      experienceWeeks,
      userId
    });

    const savedSkill = await newSkill.save();
    res.status(201).json(savedSkill);
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Function to update a skill
const updateSkill = async (req, res) => {
  const { id } = req.params;
  const { skillName, knowledgeLevel, experienceWeeks } = req.body;

  // Validate input fields
  if (!skillName || !knowledgeLevel || !experienceWeeks) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const updatedSkill = await Skill.findByIdAndUpdate(
      id,
      { skillName, knowledgeLevel, experienceWeeks },
      { new: true }
    );

    if (!updatedSkill) {
      return res.status(404).json({ message: 'Skill not found.' });
    }

    res.status(200).json(updatedSkill);
  } catch (error) {
    console.error('Error updating skill:', error);
    res.status(500).json({ message: 'Error updating skill.' });
  }
};

// Function to delete a skill
const deleteSkill = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedSkill = await Skill.findByIdAndDelete(id);

    if (deletedSkill) {
      res.status(200).json({ message: 'Skill deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Skill not found.' });
    }
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getAllSkills,
  getSkillsByUserId,
  addSkill,
  updateSkill,
  deleteSkill
};
