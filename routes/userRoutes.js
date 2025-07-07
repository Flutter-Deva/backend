const express = require('express');
const path = require('path');
const { 
  registerUser, 
  loginUser, 
  getAllUsers, 
  getUser,
  requestLoginOTP, 
  loginWithOTP,
  uploadResume,
  deleteResume,
  updateUserImage,
  changePassword,
  updateUserData,
  updateUserCompanyDataLinks,
  updateUserCompanyDataContact,
  updateCompanyData,
  updateNotificationSettings,
  saveJob,
  getUserByEmail,
  removeSavedJob,
  getUserDetails,
  editUserProfile,
  getSavedJobs,
  saveToken 
} = require('../controllers/userController'); // Importing all necessary controllers
const multer = require('multer');
const router = express.Router();
const resumeUploadMiddleware = multer({ dest: 'uploads/' });
// Define Upload Storage for Profile Images
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/')); // Store in "uploads/"
    },
    filename: (req, file, cb) => {
        cb(null, `profile_${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Multer Middleware for Profile Images
const profileUploadMiddleware = multer({
    storage: profileStorage,
    limits: { fileSize: 2 * 1024 * 1024 } // Limit: 2MB
});

// Routes for user operations
router.post('/register', registerUser);              // Register a new user
router.post('/login', loginUser);                    // Login with email and password
router.post('/request-login', requestLoginOTP);      // Request OTP for login
router.post('/login-otp', loginWithOTP);             // Login with OTP
router.get('', getAllUsers);                         // Get all users (no authentication needed)
router.get('/:id', getUser);                        // Get single user
router.post('/upload-resume/:user_id', resumeUploadMiddleware.single('resume'), uploadResume);       // Upload resume
router.delete('/delete-resume/:user_id', deleteResume);      // Delete resume
router.put('/update-image/:id', profileUploadMiddleware.single('image'), updateUserImage);         // Update user image
router.put('/change-password/:id', changePassword);         // Change user password
router.put('/update-data/:id', updateUserData);             // Update user data
router.put('/update-data-links/:id', updateUserCompanyDataLinks);             // Update user data company links
router.put('/update-data-contact/:id', updateUserCompanyDataContact);
router.put('/update-companyData/:id', updateCompanyData);    //Update Company data
router.put('/update-notifications', updateNotificationSettings); // Update notification settings
router.put('/save-jobs', saveJob);
router.get('/email/:email', getUserByEmail);
router.get('/save-jobs/:userId', getSavedJobs);
router.put('/remove-save-job', removeSavedJob);
router.get('/details/:id', getUserDetails);
router.put('/edit/:user_id', editUserProfile);
router.post('/save-token', saveToken);

module.exports = router;  
