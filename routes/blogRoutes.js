const express = require('express');
const { getAllBlogs, createBlog, deleteBlog, getBlogById, getBlogsByUserId, updateBlog } = require('../controllers/blogController');
const multer = require('multer');
const router = express.Router();

// Define routes for blogs
router.get('', getAllBlogs); // Route to get all blogs
router.post('', multer().single('image'), createBlog); // Route to create a new blog (with image upload)
router.delete('/:id', deleteBlog); // Route to delete a blog by ID
router.get('/:id', getBlogById);
router.put('/:id', updateBlog);
router.get('/user/:id', getBlogsByUserId);

module.exports = router;
