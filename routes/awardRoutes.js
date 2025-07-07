const express = require('express');
const {
  getAllAwards,
  getAwardById,
  createAward,
  updateAward,
  deleteAward,
} = require('../controllers/awardController');

const router = express.Router();

// Define routes
router.get('/', getAllAwards); // Get all awards
router.get('/:id', getAwardById); // Get award by ID
router.post('/', createAward); // Create new award (expect user_id in body)
router.put('/:id', updateAward); // Update an award (expect user_id in body)
router.delete('/:id', deleteAward); // Delete an award (expect user_id in body)

module.exports = router;
