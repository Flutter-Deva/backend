const express = require('express');
const { getAllLogins, getSecondLastLoginInfo } = require('../controllers/loginController');
const router = express.Router();

router.get('', getAllLogins);
router.get('/:id', getSecondLastLoginInfo);

module.exports = router;
