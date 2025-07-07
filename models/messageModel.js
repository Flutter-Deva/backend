const mongoose = require('mongoose');

// Define the Message schema
const MessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, 
{
    timestamps: true
});

// Create and export the Message model
const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;