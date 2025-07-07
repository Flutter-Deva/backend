// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // Adjust the number of salt rounds as needed

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  address: { type: String },
  country: { type: String },
  dateOfBirth: { type: Date },
  licenseNumber: { type: String },
   latitude: { type: String , default: "" },  // ✅ Added latitude field
    longitude: { type: String, default: ""  },
    state: {type: String, default: "" },
    city: {type: String, default: "" },
  typeOfWork: { type: String, enum: ['Full-time', 'Part-time'] },
  nationality: { type: String },
  resume: { type: String },
  resumeType: { type: String },
  mobile1: { type: String },
  mobile2: { type: String },
  age: { type: Number },
  gender: { type: String },
  linkedin: { type: String },  // LinkedIn field for both Candidate and Employer
  image: { type: String },
  role: { type: String, required: true, enum: ['candidate', 'employer', 'admin', 'user-admin', 'plan-admin', 'job-admin', 'freejob-admin', 'super-admin'] },
  walletPoints: { type: Number, default: 0 },
  myrefcode: {
    type: String,
    unique: true, // Ensure myrefcode is unique
  },

  // DND feature
  dnd: {
    isActive: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
  },

  // Candidate-specific fields
  currentJobTitle: { type: String },
  experienceLevel: { type: String },
  availability: { type: String },
  maritalStatus: { type: String },

  // Employer-specific fields
  companyName: { type: String },
  companyWebsite: { type: String },
  companyAddress: { type: String },
  companyIndexNo: { type: String },
  companyEstablishmentYear: { type: Number },
  companyContactPerson: {
    name: { type: String },
    designation: { type: String },
    contactNumber: { type: String },
    officialEmail: { type: String },
    personalEmail: { type: String },
    country: { type: String, default: ""  },
    mobileNumber: { type: String },
    callTimings: { type: String },
  },

  // Social media links
  linkedin: { type: String },
  github: { type: String },
  portfolio: { type: String },
  other: { type: String },

  category: { type: String },
  city: { type: String },
  zipCode: { type: String },
  about: { type: String },

  // OTP and verification
  otp: { type: String, default: '' },
  otpExpiration: Date,
  verified: { type: Boolean, default: false },
  complete: { type: Boolean, default: false },

  // User activation status
  active: { type: Boolean, default: true },
  registeredTimeStamp: { type: Date, default: Date.now },
  jobPostIds: [{ type: mongoose.Schema.Types.ObjectId }],
  deviceToken: { type: String, default: '' }, 
});

// Hash the password before saving
UserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    bcrypt.hash(this.password, SALT_ROUNDS, (err, hash) => {
      if (err) {
        return next(err);
      }
      this.password = hash; // Store the hash
      next();
    });
  } else {
    next();
  }
});

// Use mongoose.models to prevent redefinition of the model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

module.exports = User;
