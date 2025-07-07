const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skillSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  skillName: { type: String, required: true },
  knowledgeLevel: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced'],
    required: true
  },
  experienceWeeks: { type: Number, required: true }
});

module.exports = mongoose.model('Skill', skillSchema);