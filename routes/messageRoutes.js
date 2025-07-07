const express = require('express');
const {
  getAllMessages,
  createMessage,
  getMessagesBetweenUsers,
  getUserMessagesById,
  updateMessageReadStatus,
  getUnreadMessageCount,
  updateMessage,
  getUserListFromMessages,
  deleteMessage,
  getLatestMessageBetweenUsers,
} = require('../controllers/messageController');

const router = express.Router();

router.get('/', getAllMessages);
router.post('/', createMessage);
router.get('/users', getMessagesBetweenUsers);
router.get('/latest-msg',getLatestMessageBetweenUsers);
router.get('/:id', getUserMessagesById);
router.put('/read/:id', updateMessageReadStatus);
router.get('/notify/:id', getUnreadMessageCount);
router.put('/:id', updateMessage);
router.get('/user-list/:id', getUserListFromMessages);
router.delete('/:id', deleteMessage);

module.exports = router;
