const express = require('express');
const { getAllDynamicPlans } = require('../controllers/dynamicPlanController');
const router = express.Router();

router.get('', getAllDynamicPlans);


module.exports = router;
