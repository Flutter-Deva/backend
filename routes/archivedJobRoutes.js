const express = require('express');
const { getAllArchivedJobs } = require('../controllers/archivedJobController');
const router = express.Router();

router.get('', getAllArchivedJobs);

module.exports = router;
