const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  billid: String,
  cid: String,
  billdate: String,
  pid: Number,
  Qty: Number,
  total: Number,

  // 🔥 ADD THIS
  status: {
    type: String,
    default: "Processing"
  },
  updatedAt: Date,
  updatedBy: String
});

module.exports = mongoose.model("Bill", billSchema);