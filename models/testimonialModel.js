const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const testimonialSchema = new Schema({
  photo: { type: String }, // URL or path to the photo
  name: { type: String, required: true },
  designation: { type: String },
  title: { type: String},
  message: { type: String, required: true },
  isDisplayed: { type: Boolean, default: false } // New boolean field to indicate display status
}, {
  timestamps: true // Optional: Adds createdAt and updatedAt timestamps
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
