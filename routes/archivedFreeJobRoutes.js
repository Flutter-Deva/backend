const express = require('express');
const { getAllArchivedFreeJobs } = require('../controllers/archivedFreeJobController');
const router = express.Router();

router.get('', getAllArchivedFreeJobs);

module.exports = router;
