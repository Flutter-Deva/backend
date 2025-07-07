const express = require('express');
const { getAllArchivedUsers } = require('../controllers/archivedUserController');
const router = express.Router();

router.get('', getAllArchivedUsers);

module.exports = router;
