// product.model.js

const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  pid: { type: Number, required: true, unique: true },

  pname: { type: String, required: true, trim: true },

  pprice: { type: Number, required: true },

  oprice: { type: Number, required: true },

  ppicname: { type: String, default: "", trim: true },

  pcatgid: { type: Number, required: true },

  vid: { type: Number, required: true },

  status: { type: String, default: "Inactive" }
},{
  collection: "Product"
});

module.exports = mongoose.model("Product", ProductSchema);