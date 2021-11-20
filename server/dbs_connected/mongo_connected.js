const mongoose = require('mongoose');
const constants = require("../config/constants");
const { DB_USER, DB_PASS } = constants;

mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASS}@cluster0.s0qp4.mongodb.net/sync-along`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log(`MongoDB Connected`);
});

module.exports = db