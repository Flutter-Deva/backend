const express = require('express');
const { 
  getAllPlans, 
  purchaseByWalletpoint, 
  purchase, 
  getPlansByUserId, 
  getPlanById, 
  getPlansForDiscount, 
  getAllPlansWithUserInfo 
} = require('../controllers/planController');
const router = express.Router();

router.get('', getAllPlans);
router.post('/purchaseByWalletpoint', purchaseByWalletpoint);
router.post('/purchase', purchase);
router.get('/user/:user_id', getPlansByUserId);
router.get('/:id', getPlanById);
router.get('/discount/:userId', getPlansForDiscount);
router.get('/withUserInfo', getAllPlansWithUserInfo);

module.exports = router;
