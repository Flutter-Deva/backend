const Message = require('../models/messageModel');
const User = require('../models/userModel'); // Assuming User model is needed for some functions
const mongoose = require('mongoose');
const admin = require('../config/firebase');

// Get all messages
const getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find(); // Retrieve all messages
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new message
const createMessage = async (req, res) => {
  const { senderId, receiverId, text } = req.body;

  try {
    // 1. Save message to DB
    const newMessage = new Message({ senderId, receiverId, text });
    await newMessage.save();

    // 2. Get sender name
    const sender = await User.findById(senderId);
    const senderName = sender?.name || "New Message";

    // 3. Get receiver token
    const receiver = await User.findById(receiverId);
    const receiverToken = receiver?.deviceToken;
    const receiverName=receiver?.name ||"New Message";

    // 4. Send FCM notification
    if (receiverToken) {
      const messagePayload = {
        token: receiverToken,
        notification: {
          title: senderName,
          body: text,
        },
        data: {
          senderId: receiverId.toString(),
          receiverId: senderId.toString(),
          contactName:senderName,
          type: "chat",
        },
      };

      await admin.messaging().send(messagePayload);
      console.log("✅ Notification sent to:", receiverToken);
    } else {
      console.warn("⚠️ Receiver has no device token.");
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("❌ Error creating message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get messages between two users
const getMessagesBetweenUsers = async (req, res) => {
  const { senderId, receiverId } = req.query;

  if (!senderId || !receiverId) {
    return res.status(400).json({ message: 'Sender ID and Receiver ID are required' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//latest message

const getLatestMessageBetweenUsers = async (req, res) => {
  const { senderId, receiverId } = req.query;

  if (!senderId || !receiverId) {
    return res.status(400).json({ message: 'Sender ID and Receiver ID are required' });
  }

  try {
    const latestMessage = await Message.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: -1 }); // Find ONE message, sorted newest first

    if (!latestMessage) {
      return res.status(404).json({ message: 'No messages found between users' });
    }

    res.status(200).json(latestMessage);
  } catch (error) {
    console.error('Error retrieving latest message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



// Get all messages related to a user by their ID
const getUserMessagesById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const messages = await Message.find({
      $or: [{ senderId: id }, { receiverId: id }],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update message read status
const updateMessageReadStatus = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const result = await Message.updateMany(
      { receiverId: id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      message: 'Messages updated successfully',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error updating messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread message count for a user
const getUnreadMessageCount = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    const readCount = await Message.countDocuments({
      receiverId: id,
      read: false,
    });

    res.json({ readCount });
  } catch (error) {
    console.error('Error retrieving notification count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a message
const updateMessage = async (req, res) => {
  const { id } = req.params;
  const { senderId, newText } = req.body;

  if (!senderId || !newText) {
    return res.status(400).json({ message: 'Sender ID and new text are required' });
  }

  try {
    const message = await Message.findOne({ _id: id, senderId });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or sender ID does not match' });
    }

    message.text = newText;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a list of users from messages
const getUserListFromMessages = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'ID is required' });
  }

  try {
    const messages = await Message.find({
      $or: [{ senderId: id }, { receiverId: id }],
    }).exec();

    const userIds = new Set();
    messages.forEach((message) => {
      if (message.senderId.toString() !== id) userIds.add(message.senderId);
      if (message.receiverId.toString() !== id) userIds.add(message.receiverId);
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } }).exec();
    res.json(users);
  } catch (error) {
    console.error('Error retrieving user list from messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a message
const deleteMessage = async (req, res) => {
  const { id } = req.params;
  const { senderId } = req.body;

  if (!senderId) {
    return res.status(400).json({ message: 'Sender ID is required' });
  }

  try {
    const message = await Message.findOne({ _id: id, senderId });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or sender ID does not match' });
    }

    await Message.deleteOne({ _id: id });
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
