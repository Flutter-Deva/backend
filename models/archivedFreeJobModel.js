const mongoose = require('mongoose');
const Schema = mongoose.Schema; // Import Schema

const archivedFreeJobsSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true, // This can be omitted, as required: false is the default
  },
  jobTitle: {
    type: String,
    required: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
  jobCategory: {
    type: String,
    enum: ['Technical', 'Non-Technical'],
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
    required: true, // This can be omitted, as required: false is the default
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
    required: false, // This can be omitted, as required: false is the default
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
    required: false, // This can be omitted, as required: false is the default
  },
  languagesRequired: {
    type: [String],
    required: false, // This can be omitted, as required: false is the default
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
    required: false, // This can be omitted, as required: false is the default
  },
  contactPhone: {
    type: String,
    required: false, // This can be omitted, as required: false is the default
  },
  contactEmail: {
    type: String,
    required: false, // This can be omitted, as required: false is the default
  },
  plan_id: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  keyResponsibilities: { // New field for key responsibilities
    type: [String],
    required: false,
  },
  skillsAndExperience: { // New field for skills and experience
    type: [String],
    required: false,
  },
});

module.exports = mongoose.model('ArchivedFreeJobs', archivedFreeJobsSchema);