const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const archivedUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  name: { type: String },
  address: { type: String },
  country: { type: String },
  dateOfBirth: { type: Date },
  nationality: { type: String },
  resume: { type: String },
  resumeType: { type: String },
  mobile1: { type: String },
  mobile2: { type: String },
  age: { type: Number },
  gender: { type: String },
  linkedin: { type: String },
  image: { type: String },
  role: { type: String, required: true, enum: ['candidate', 'employer', 'admin', 'super-admin'] },
  walletPoints: { type: Number, default: 0 },
  myrefcode: { type: String, unique: true },

  // DND feature fields
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
    country: { type: String },
    mobileNumber: { type: String },
    callTimings: { type: String },
  },

  // Social media links
  facebook: { type: String },
  twitter: { type: String },
  googlePlus: { type: String },

  category: { type: String },
  city: { type: String },
  zipCode: { type: String },
  about: { type: String },

  // OTP and Verification fields
  otp: { type: String, default: '' },
  otpExpiration: Date,
  verified: { type: Boolean, default: false },

  // User activation status
  active: { type: Boolean, default: true },
  registeredTimeStamp: { type: Date, default: Date.now },

  archivedAt: { type: Date, default: Date.now },  // Archive timestamp
});

// You can hash the password if needed when saving archived users as well.
archivedUserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    bcrypt.hash(this.password, 10, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  } else {
    next();
  }
});

module.exports = mongoose.model('ArchivedUser', archivedUserSchema);