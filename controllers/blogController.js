const Blog = require('../models/blogModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get all blogs
const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find(); // Retrieve all blog posts
    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Define storage configuration for blog images
const blogImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/blog/images')); // Adjusted path for saving blog images
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const filename = `${Date.now()}${extension}`;
    cb(null, filename);
  }
});

// Set file upload limits and file types (JPEG, PNG, GIF)
const uploadBlogImage = multer({
  storage: blogImageStorage,
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

// Handle blog post submission (with image upload)
const createBlog = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }

    const { title, userId, content } = req.body;
    if (!title || !userId || !content) {
      return res.status(400).json({ error: 'Title, userId, and content are required' });
    }

    const imageUrl = req.file ? `/blog/images/${req.file.filename}` : null;

    const newBlog = new Blog({
      title,
      userId,
      content,
      image: imageUrl
    });

    await newBlog.save();
    res.status(201).json({ message: 'Blog post created successfully', blog: newBlog });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'An error occurred while creating the blog post' });
  }
};

// Handle blog deletion, including associated image removal
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the blog by ID
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Delete the associated image file if it exists
    if (blog.image) {
      const imagePath = path.join(__dirname, '../public', blog.image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error(`Error deleting image file: ${imagePath}`, err);
        } else {
          console.log(`Image file deleted: ${imagePath}`);
        }
      });
    }

    // Delete the blog from the database
    await Blog.findByIdAndDelete(id);

    res.status(200).json({ message: 'Blog and associated image deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getBlogsByUserId = async (req, res) => {
   try {
    // Extract the userId from the route parameter ':id'
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch blogs uploaded by the specific user
    const blogs = await Blog.find({ userId: userId });

    // If no blogs found, return a message
    if (blogs.length === 0) {
      return res.status(404).json({ message: "No blogs found for this user" });
    }

    // Send the fetched blogs as a JSON response
    return res.json(blogs);
  } catch (error) {
    // Log the error and send a server error response
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: "Server error" });
  }
}

const getBlogById = async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while retrieving the blog' });
  }
}

// function to update blogs
const updateBlog = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const blog = await Blog.findByIdAndUpdate(
      id,
      { content },
      { new: true } // Return the updated blog
    );

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'An error occurred while updating the blog' });
  }
};

module.exports = { getAllBlogs, createBlog, deleteBlog, getBlogById, getBlogsByUserId, updateBlog  };
