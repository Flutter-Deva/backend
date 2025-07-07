const multer = require('multer');
const path = require('path');
const Testimonial = require('../models/testimonialModel');

// Function to retrieve all testimonials
const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find();
    res.status(200).json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Function to define image storage for testimonials
const configureTestimonialImageStorage = () => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../public/testimonials/images')); // Adjust path for testimonials
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname);
      const filename = `${Date.now()}${extension}`;
      cb(null, filename);
    }
  });
};

// Function to configure file upload for testimonials
const configureTestimonialImageUpload = () => {
  return multer({
    storage: configureTestimonialImageStorage(),
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF files are allowed.'), false);
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
  });
};

// Function to handle testimonial submission
const handleTestimonialSubmission = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }

    const { name, message, designation, title } = req.body;

    // Validate required fields
    if (!name || !message) {
      return res.status(400).json({ error: 'Name and message are required' });
    }

    // Check if a file was uploaded
    const photoUrl = req.file ? `/testimonials/images/${req.file.filename}` : null;

    // Create a new testimonial
    const newTestimonial = new Testimonial({
      photo: photoUrl,
      name,
      designation: designation || '', // Default to empty string if not provided
      title,
      message
    });

    // Save the testimonial to the database
    await newTestimonial.save();

    // Respond with success
    res.status(201).json({ message: 'Testimonial created successfully', testimonial: newTestimonial });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    res.status(500).json({ error: 'An error occurred while creating the testimonial' });
  }
};

// Function to fetch testimonials for display
const getDisplayedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isDisplayed: true });
    res.status(200).json({ testimonials });
  } catch (error) {
    console.error('Error fetching displayed testimonials:', error);
    res.status(500).json({ error: 'An error occurred while fetching testimonials' });
  }
};

module.exports = {
  getAllTestimonials,
  configureTestimonialImageUpload,
  handleTestimonialSubmission,
  getDisplayedTestimonials
};