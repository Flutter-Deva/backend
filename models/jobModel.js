const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const packageTypes = ['Basic', 'Standard', 'Extended'];
const careerLevels = ['Entry-Level', 'Associate', 'Senior', 'Manager', 'Director', 'Vice President', 'C-Level(CEO)'];

const jobSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  jobCategory: {
    type: String,
    enum: ['Technical', 'Non-Technical'],
    required: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  specialisms: { 
    type: [String],
    required: true,
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'],
    required: true,
  },
  offeredSalary: {
    type: Number,
    required: true,
  },
  careerLevel: {
    type: String,
    enum: careerLevels,
    required: true,
  },
  experienceYears: { 
    type: Number,
    required: false,
  },
  experienceMonths: { 
    type: Number,
    required: false,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Any'],
    required: true,
  },
  industry: {
    type: String,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  applicationDeadlineDate: {
    type: Date,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  completeAddress: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: false,
  },
  longitude: {
    type: Number,
    required: false,
  },
  companyName: {
    type: String,
    required: true,
  },
  companyWebsite: {
    type: String,
    required: false,
  },
  plan_id: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  postedDate: {
    type: Date,
    default: Date.now,
  },
  updatedDate: {
    type: Date,
    default: Date.now,
  },
  benefits: {
    type: [String],
    required: false,
  },
  languagesRequired: {
    type: [String],
    required: false,
  },
  vacancies: {
    type: Number,
    required: true,
  },
  employmentStatus: {
    type: String,
    enum: ['Permanent', 'Contractual', 'Freelance'],
    required: true,
  },
  contactPersonName: {
    type: String,
    required: false,
  },
  contactPhone: {
    type: String,
    required: false,
  },
  contactEmail: {
    type: String,
    required: false,
  },
  keyResponsibilities: { // New field for key responsibilities
    type: [String],
    required: false,
  },
  skillsAndExperience: { // New field for skills and experience
    type: [String],
    required: false,
  },
  seen: {
    type: Boolean,
    default: false,
  },
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;