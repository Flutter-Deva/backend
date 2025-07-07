const express = require('express');
const { 
  getAllNotificationLogs, 
  getNotificationLogById, 
  getCandidateNotifications, 
  getEmployerNotifications, 
  updateNotificationReadStatus 
} = require('../controllers/notificationLogController');
const router = express.Router();

router.get('', getAllNotificationLogs);
router.get('/:id', getNotificationLogById);
router.get('/candidate/:id', getCandidateNotifications);
router.get('/employer/:id', getEmployerNotifications);
router.put('/:id', updateNotificationReadStatus);

module.exports = router;
