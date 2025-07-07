const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loginInfoSchema = new Schema({
  location: { type: String, required: true },
  date: { type: Date, default: Date.now, required: true },
  //browser: { type: String, required: true },
  //operatingSystem: { type: String, required: true }
}, { _id: false }); // Disable _id generation for embedded documents

const loginSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  loginfo: [loginInfoSchema] // Array of login records
});

module.exports = mongoose.model('Login', loginSchema);
