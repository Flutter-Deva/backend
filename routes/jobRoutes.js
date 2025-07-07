const express = require('express');
const { getAllJobs, postJob, getShortlistedJobsById, getAllJobsCount,getJobCountByUserId, findJobsByUserId } = require('../controllers/jobController');
const router = express.Router();

router.get('', getAllJobs);
router.get('/jobCount', getAllJobsCount);
router.post('', postJob);
router.get('/get-shortlisted-job-by-id/:id', getShortlistedJobsById);
router.get('/find-job/:id', findJobsByUserId);
router.get('/posted-jobs/:id', getJobCountByUserId);

module.exports = router;
