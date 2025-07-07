const mongoose = require('mongoose');

// Define the Experience schema
const awardSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { 
    type: String,
     required: true 
  },
  organization: { 
    type: String, 
    required: true 
  },
  year: { 
    type: String,
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  } // Add reference to User
});

// Create and export the Experience model
const Award = mongoose.model('Award', awardSchema);
module.exports = Award;