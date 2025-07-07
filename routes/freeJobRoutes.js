const express = require('express');
const { getAllFreeJobs, postFreeJob } = require('../controllers/freeJobController');
const router = express.Router();

router.get('', getAllFreeJobs);
router.post('', postFreeJob);

module.exports = router;
