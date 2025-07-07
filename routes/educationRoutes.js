const express = require('express');
const {
  getAllEducations,
  getEducationById,
  createEducation,
  updateEducation,
  deleteEducation,
} = require('../controllers/educationController');

const router = express.Router();

// Define routes
router.get('/', getAllEducations); // Get all education records
router.get('/:id', getEducationById); // Get education record by ID
router.post('/', createEducation); // Add new education record (expect user_id in body)
router.put('/:id', updateEducation); // Update education record (expect user_id in body)
router.delete('/:id', deleteEducation); // Delete education record (expect user_id in body)

module.exports = router;
