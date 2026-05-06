const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  cid: { type: String, required: true },   // customer id (string safe)
  billid: { type: String, required: true },

  items: [
    {
      pid: String,
      pname: String,
      qty: Number,
      price: Number
    }
  ],

  total: { type: Number, default: 0 },

  paymentId: String,
  orderId: String,

  status: {
    type: String,
    default: "success"
  },

  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", OrderSchema);