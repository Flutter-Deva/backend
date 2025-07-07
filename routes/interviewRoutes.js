const express = require('express');
const { createInterview, updateInterview, deleteInterview, getInterviewById, getInterviewsByUserId, getInterviewsByEmployeeId } = require('../controllers/interviewController');
const router = express.Router();

router.post('', createInterview);
router.put('/:interviewId', updateInterview);
router.delete('/:interviewId', deleteInterview);

// Get interview by ID
router.get('/:interviewId', getInterviewById);

// Get interviews by userId
router.get('/user/:userId', getInterviewsByUserId);

// Get interviews by employeeId
router.get('/employee/:employeeId', getInterviewsByEmployeeId);

module.exports = router;
