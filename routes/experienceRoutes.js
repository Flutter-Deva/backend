const express = require('express');
const {
  getAllExperiences,
  getExperienceByUserId,
  createExperience,
  updateExperience,
  deleteExperience,
} = require('../controllers/experienceController');

const router = express.Router();

// Define routes
router.get('/', getAllExperiences);
router.get('/:id', getExperienceByUserId);
router.post('/', createExperience);
router.put('/:id', updateExperience);
router.delete('/:id', deleteExperience);

module.exports = router;
