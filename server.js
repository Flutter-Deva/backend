const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/dbConfig');
const userRoutes = require('./routes/userRoutes');
const planRoutes = require('./routes/planRoutes');
const dynamicPlanRoutes = require('./routes/dynamicPlanRoutes');
const appliedJobRoutes = require('./routes/appliedJobRoutes');
const archivedFreeJobRoutes = require('./routes/archivedFreeJobRoutes');
const archivedJobRoutes = require('./routes/archivedJobRoutes');
const archivedUserRoutes = require('./routes/archivedUserRoutes');
const awardRoutes = require('./routes/awardRoutes');
const blogRoutes = require('./routes/blogRoutes');
const educationRoutes = require('./routes/educationRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const freeJobRoutes = require('./routes/freeJobRoutes');
const jobRoutes = require('./routes/jobRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const loginRoutes = require('./routes/loginRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationLogRoutes = require('./routes/notficationLogRoutes');
const skillRoutes = require('./routes/skillRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(bodyParser.json()); // Parse JSON bodies

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/dynamic-plan', dynamicPlanRoutes);
app.use('/api/applied-jobs', appliedJobRoutes);
app.use('/api/archived-free-jobs', archivedFreeJobRoutes);
app.use('/api/archived-jobs', archivedJobRoutes);
app.use('/api/archived-users', archivedUserRoutes);
app.use('/api/awards', awardRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/free-jobs', freeJobRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/notifications', notificationLogRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
