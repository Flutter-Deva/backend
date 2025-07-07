const express = require('express');
const { getAllTestimonials, handleTestimonialSubmission, getDisplayedTestimonials } = require('../controllers/testimonialController');
const multer = require('multer');
const router = express.Router();

router.get('', getAllTestimonials);
router.post('', multer().single('image'), handleTestimonialSubmission);
router.get('/home', getDisplayedTestimonials)

module.exports = router;
