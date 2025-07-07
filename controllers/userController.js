const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const geoip = require('geoip-lite');
const rateLimit = require('express-rate-limit');
const { isEmail } = require('validator');
const archivedUser = require('../models/archivedUserModel');  // Replace with correct path to archived model
const Login = require('../models/loginModel');  // Replace with correct path to your login model
const { parseUserAgent } = require('../utils/parseUserAgent');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { countReset } = require('console');
const mongoose = require('mongoose');
const Education = require('../models/educationModel');
const Experience = require('../models/experienceModel');
const Award = require('../models/awardModel');
const Skill = require('../models/skillModel');
const Job = require('../models/jobModel');
const FreeJob = require('../models/freeJobModel');
const Plan = require('../models/planModel');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Register user
const registerUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ username, email, password, role });
    if (user) {
      res.status(201).json({
        id: user._id,
        name: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password, role } = req.body;
  console.log('Entered password:', password);

  try {
    const user = await User.findOne({ email });
    if (user) {
      const match = await user.matchPassword(password);
      console.log('Password match:', match); // Log the result of password comparison
      if (match) {
        res.status(200).json({
          id: user._id,
          name: user.username,
          email: user.email,
          address: user.address,
          country:user.country,
          role: user.role,
          token: generateToken(user._id),
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Middleware to limit OTP requests
const otpResendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many OTP requests from this IP, please try again after 15 minutes',
});

// Nodemailer transporter setup for sending OTP email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Utility function to send OTP email
const sendOTPLog = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to: email,
    subject: 'OTP for Login',
    text: `Your OTP for Login is: ${otp}`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        reject(error);
      } else {
        console.log('Email sent:', info.response);
        resolve();
      }
    });
  });
};

// Utility function to generate a numeric OTP
const generateNumericOTP = (length) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    otp += digits[randomIndex];
  }
  return otp;
};

// Controller function to request OTP
const requestLoginOTP = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user;

    // First, try finding the user by email
    if (isEmail(email)) {
      user = await User.findOne({ email, active: true });
    }
    // If it's not an email, check if it's a mobile number (mobile1 or mobile2)
    else if (email && email.length >= 7 && !isNaN(email)) {
      user = await User.findOne({ $or: [{ mobile1: email }, { mobile2: email }], active: true });
    }
    // Otherwise, treat it as a username
    else {
      user = await User.findOne({ username: email, active: true });
    }

    // If the user is not found, check in the archived users
    if (!user) {
      if (isEmail(email)) {
        user = await archivedUser.findOne({ email, active: true });
      } else if (email && email.length >= 7 && !isNaN(email)) {
        user = await archivedUser.findOne({ $or: [{ mobile1: email }, { mobile2: email }], active: true });
      } else {
        user = await archivedUser.findOne({ username: email, active: true });
      }

      if (user) {
        const restoredUser = new User(user.toObject());
        await restoredUser.save();
        await archivedUser.deleteOne({ _id: user._id });

        user = restoredUser;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate OTP
    const otp = generateNumericOTP(6);
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    user.otp = hashedOtp;
    user.otpExpiration = Date.now() + 3600000; // OTP valid for 1 hour
    await user.save();

    // Send OTP via email
    await sendOTPLog(user.email, otp);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error("OTP request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Controller function to login with OTP
const loginWithOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    let user;

    // Check if input is an email or a username or mobile number
    if (isEmail(email)) {
      user = await User.findOne({ email });
    } else if (email && email.length >= 7 && !isNaN(email)) {
      user = await User.findOne({ $or: [{ mobile1: email }, { mobile2: email }], active: true });
    } else {
      user = await User.findOne({ username: email });
    }

    // Check if the user is not found
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if OTP has expired
    if (user.otpExpiration < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Capture user agent (browser) and IP address
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Get geolocation from IP address
    const geo = geoip.lookup(ipAddress);
    const location = geo ? `${geo.city}, ${geo.region}, ${geo.country}` : 'Unknown';

    // Parse user agent to get browser and operating system
    //const { browser, os } = parseUserAgent(userAgent);

    // Clear OTP and expiration
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h', // Token expiration time
    });
    console.log(`User logged in: ${user.username}`);

    // Format date in a readable timestamp format
    const formattedDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    });

    // Check if there is an existing login record for the user
    let login = await Login.findOne({ userId: user._id });

    if (login) {
      // Add a new loginfo entry to the existing login record
      login.loginfo.push({
        location,
        date: formattedDate
        //browser,
        //operatingSystem: os
      });
      await login.save();
    } else {
      // Create a new login record with the first loginfo entry
      login = new Login({
        userId: user._id,
        loginfo: [{
          location,
          date: formattedDate
          //browser,
          //operatingSystem: os
        }]
      });
      await login.save();
    }

    // Send token in response
    res.json({ token });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Retrieve all users

    // Exclude passwords from all users
    const usersWithoutPasswords = users.map(user => {
      const { password, ...otherDetails } = user._doc;
      return otherDetails;
    });

    res.status(200).json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("User data:", user);  // Log user data
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const uploadDir = path.join(__dirname, '../uploads/');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup multer storage for resumes
const resumeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files in "uploads/" directory
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        cb(null, `resume_${Date.now()}${extension}`); // Unique filename
    }
});


// Multer setup for resumes
const resumeUploadMiddleware = multer({
    storage: resumeStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Function to handle the resume upload logic
const uploadResume = async (req, res) => {
    const { user_id } = req.params;
    const { resumeType } = req.body;
    const file = req.file;

    if (!user_id || !file || !resumeType) {
        return res.status(400).json({ error: 'User ID, resume file, and resume type are required' });
    }

    try {
        const user = await User.findById(user_id);
        if (!user) {
            fs.unlink(path.join(uploadDir, file.filename), (err) => {
                if (err) console.error('Error deleting file:', err);
            });
            return res.status(404).json({ error: 'User not found' });
        }

        user.resume = `/uploads/${file.filename}`; // Update path
        user.resumeType = resumeType;
        await user.save();

        res.status(200).json({ user_id, resume: user.resume, resumeType: user.resumeType });

    } catch (error) {
        console.error('Error uploading resume:', error);

        if (file) {
            fs.unlink(path.join(uploadDir, file.filename), (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }

        res.status(500).json({ error: 'An error occurred while uploading the resume' });
    }
};

// Delete Resume Function
const deleteResume = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.resume) {
      const fileName = path.basename(user.resume);
      const filePath = path.join(publicResumeDir, fileName);

      console.log('File path for deletion:', filePath);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          return res.status(500).json({ error: 'An error occurred while deleting the resume file' });
        }
        console.log('File deleted successfully');
      });

      user.resume = '';
      await user.save();
      console.log('User resume cleared successfully');

      res.status(200).json({ user_id, resume: user.resume });
    } else {
      res.status(404).json({ error: 'No resume found for this user' });
    }
  } catch (error) {
    console.error('Error deleting resume:', error);
    res.status(500).json({ error: 'An error occurred while deleting the resume' });
  }
}

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Store in 'uploads/' directory
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        cb(null, `profile_${Date.now()}${extension}`); // Unique filename
    }
});

const profileUploadMiddleware = multer({
    storage: profileStorage,
    limits: { fileSize: 2 * 1024 * 1024 } // Limit to 2MB
});

// Update User Image Function
const updateUserImage = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (req.file) {
            // Delete old image if exists
            if (user.image) {
                const oldImagePath = path.join(uploadDir, path.basename(user.image));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Save new image
            user.image = `/uploads/${req.file.filename}`;
            await user.save();

            return res.status(200).json({
                message: 'Profile image updated',
                image: user.image // Ensure this field is always returned
            });
        } else {
            return res.status(400).json({ error: 'No file uploaded' });
        }

    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


// Change Password Function
const changePassword = async (req, res) => {
  const { newPassword } = req.body;
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).send({
      message: 'Password updated successfully',
      user: { name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
}
// Update User Data Function
const updateUserData = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, username, email, mobile1, address, gender, country, licenseNumber } = req.body;

    // Validate required fields
    if (!email || !mobile1) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Find and update only specified fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { name, username, email, mobile1, address, gender, country, licenseNumber },
      },
      { new: true } // Return the updated user object
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Update User Data Company links Function
const updateUserCompanyDataLinks = async (req, res) => {
  try {
    const userId = req.params.id;
    const {name, email, mobileNumber, linkedin, github, portfolio, other } = req.body;

    // Validate required fields
    if (!email || !mobileNumber) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Find and update only specified fields
    const updatedUserCompanyDataLinks = await User.findByIdAndUpdate(
      userId,
      {
        $set: { email, mobileNumber, linkedin, github, portfolio, other },
      },
      { new: true } // Return the updated user object
    );

    if (!updatedUserCompanyDataLinks) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUserCompanyDataLinks);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

const updateUserCompanyDataContact = async (req, res) => {
    try {
        const userId = req.params.id;
        const { companyAddress, latitude, longitude, country, state, city,  email, mobileNumber } = req.body;

        console.log("🔹 Received Data for Update:", req.body);

        if (!email || !mobileNumber) {
            console.log("❌ Missing required fields");
            return res.status(400).json({ message: "Required fields are missing" });
        }

        // ✅ Ensure { new: true } is used to return updated document
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    companyAddress,
                    latitude,
                    longitude,
                    country,
                    state,
                    city,
                    email,
                    mobileNumber
                }
            },
            { new: true } // ✅ Ensure latest data is returned
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log("✅ Updated User Data:", updatedUser);
        res.json(updatedUser); // ✅ Send updated data

    } catch (error) {
        console.error("❌ Error updating user:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const getUserDetails = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  try {
    // Find user by ObjectId
    const user = await User.findById(id);
    if (user) {
      const { password, ...otherDetails } = user._doc; // Exclude password from response
      // Fetch the user's skills from the Skill model
      const skills = await Skill.find({ userId: id });
      // Fetch the user's education from the Education model
      const education = await Education.find({ user_id: id });
      // Fetch the user's experience from the Experience model
      const experience = await Experience.find({ user_id: id });
      // Fetch the user's awards from the Award model
      const awards = await Award.find({ user_id: id });
      // Return all the data including user details, skills, education, experience, and awards
      const plans = await Plan.find({ user_id : id})
      res.status(200).json({
        ...otherDetails, // user details without password
        skills,
        education,
        experience,
        awards,
        plans,
      });
    } else {
      res.status(404).json({ message: "No such user exists" });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Employer Company Data Function
const updateCompanyData = async (req, res) => {
  try {
    const userId = req.params.id;
    const { companyName, email, companyWebsite, companyAddress, companyIndexNo, companyEstablishmentYear,myrefcode,
         companyContactPerson: {name,officialEmail,personalEmail,mobileNumber,country,callTimings},} = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Find and update only specified fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: { companyName, email, companyWebsite, companyAddress, companyIndexNo, companyEstablishmentYear,myrefcode,
        companyContactPerson: {name,officialEmail,personalEmail,mobileNumber,country,callTimings},},
      },
      { new: true } // Return the updated user object
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Update Notification Settings Function
const updateNotificationSettings = async (req, res) => {
  const { dndOption, startDate, endDate } = req.body;

  if (!dndOption || (dndOption === 'custom' && (!startDate || !endDate))) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  try {
    const userId = req.user.id;

    const updateData = {
      dndOption,
      dndStartDate: null,
      dndEndDate: null,
    };

    if (dndOption !== 'none') {
      if (dndOption === 'custom') {
        updateData.dndStartDate = new Date(startDate);
        updateData.dndEndDate = new Date(endDate);
      } else if (dndOption === '1week') {
        updateData.dndStartDate = new Date();
        updateData.dndEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      } else if (dndOption === '2weeks') {
        updateData.dndStartDate = new Date();
        updateData.dndEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { notificationSettings: updateData } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return res.status(500).json({ message: 'Failed to update notification settings' });
  }
}

//SaveJobs Functionality
const saveJob = async (req, res) => {
  const { user_id, post_id } = req.body;

  console.log('Received request to save job:', { user_id, post_id });

  if (!user_id || !post_id) {
    console.log('Missing user_id or post_id');
    return res.status(400).json({ error: 'user_id and post_id are required' });
  }

  try {
    const user = await User.findById(user_id);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ valid: false, message: 'User not found' });
    }

    // Check if the job is already saved
    if (user.jobPostIds.includes(post_id)) {
      console.log('Job already saved');
      return res.status(200).json({ valid: false, message: 'Already Saved' }); // Change status to 200 and message
    }

    // Save the job
    user.jobPostIds.push(post_id);
    await user.save();

    console.log('Job saved successfully');
    return res.status(200).json({ valid: true, message: 'Job Saved' });
  } catch (error) {
    console.error('Error saving job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to getsaved jobs
const getSavedJobs = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const jobPostIds = user.jobPostIds;

    // Fetch jobs from both collections
    const [jobs, freeJobs] = await Promise.all([
      Job.find({ _id: { $in: jobPostIds } }),
      FreeJob.find({ _id: { $in: jobPostIds } }),
    ]);

    // Combine both job lists into a single array
    const allJobs = [...jobs, ...freeJobs];

    return res.status(200).json({ count: allJobs.length, jobs: allJobs });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Function to remove a saved job
const removeSavedJob = async (req, res) => {
  const { user_id, post_id } = req.body;

  if (!user_id || !post_id) {
    return res.status(400).json({ error: 'user_id and post_id are required' });
  }

  try {
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ valid: false, message: 'User not found' });
    }

    // Check if the job is saved
    const jobIndex = user.jobPostIds.indexOf(post_id);

    if (jobIndex === -1) {
      return res.status(400).json({ valid: false, message: 'Job is not saved yet' });
    }

    // Remove the job post
    user.jobPostIds.splice(jobIndex, 1);
    await user.save();

    return res.status(200).json({ valid: true, message: 'Job Removed' });
  } catch (error) {
    console.error('Error removing job:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

//Function to get user by email
const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email: email }); // Find user by email

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const editUserProfile = async (req, res) => {
  try {
    const { user_id } = req.params; // Get user_id from URL params
    const updateData = { ...req.body }; // Copy request body to updateData

    // Update the user document and return the modified user
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Save device token
const saveToken = async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ message: "User ID and token are required." });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { deviceToken: token },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Token saved successfully.",
      userId: user._id,
      deviceToken: user.deviceToken,
    });
  } catch (error) {
    console.error("Error saving token:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getAllUsers,
  getUser,
  requestLoginOTP,
  loginWithOTP,
  otpResendLimiter,
  uploadResume,
  deleteResume,
  getUserDetails,
  updateUserImage,
  changePassword,
  updateUserData,
  updateUserCompanyDataLinks,
  updateUserCompanyDataContact,
  updateCompanyData,
  profileUploadMiddleware,
  updateNotificationSettings,
  getUserByEmail,
  editUserProfile,
  saveJob, getSavedJobs, removeSavedJob,
  saveToken
};
