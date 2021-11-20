const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  user: {
    type: String,
    required: [true, 'Please add a name'],
  },
  avatar: String,
  date_time: {
    type: Date, default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'elderly'],
    default: 'user',
  },
});
const userModel = mongoose.model("users", userSchema);
exports.userModel = userModel;
