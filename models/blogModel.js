const mongoose = require('mongoose');

// Define the schema for the blog post
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,  
  },
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String, // This will store the path or URL of the image
    trim: true,
  },
  blockedRegions: {
    type: [String],  // Array of regions (e.g., country codes, continent names)
    default: [],  // Default is no blocked regions
  },
});

// Create a model from the schema
const Blog = mongoose.model('Blog', blogSchema);

// Export the model
module.exports = Blog;
