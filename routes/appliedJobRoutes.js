const express = require('express');
const { getAllAppliedJobs, validateIds,getAppliedJobsCount, getAppliedJobsById, getAllAppliedJobsWithDetails, updateSeenStatus, 
       deleteAppliedJob, applyForJob, getJobsByUserId, getApplicationUsingPostId, getApplicationUsingUserId, getShortlistedCandidates, getShortlistedCandidatesCount, getApplicationCountUsingUserId,  updateJobStatus, getApplicationUsingPostIdCount } = require('../controllers/appliedJobController');
const router = express.Router();

router.get('', getAllAppliedJobs);
router.post('/validate', validateIds);
router.get('/appliedJobs/details', getAllAppliedJobsWithDetails);
router.put('/appliedJob/seen', updateSeenStatus);
router.delete('/appliedJob', deleteAppliedJob);
router.post('/applyJob', applyForJob);
router.get('/get-job-by-userid/:user_id', getJobsByUserId);
router.get('/count/:user_id',getAppliedJobsCount);
router.get('/:user_id', getAppliedJobsById);
router.get('/user/:user_id', getApplicationUsingUserId);
router.get('/post/:post_id', getApplicationUsingPostId);
router.post('/update-job-status/:id', updateJobStatus);
router.get('/shortlisted/:user_id', getShortlistedCandidates);
router.get('/shortlisted-count/:user_id', getShortlistedCandidatesCount);
router.get('/applicants-count/:user_id', getApplicationCountUsingUserId);
router.get('/job-applicant-count/:post_id',getApplicationUsingPostIdCount)


module.exports = router;
