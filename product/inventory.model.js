const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const InventorySchema = new Schema(
  {
    pid: { type: Number, required: true, index: true }, // Product.pid

    vid: { type: Number, required: true, index: true }, // Vendor ID

    stock: { type: Number, default: 0 }, // Available stock

    reserved: { type: Number, default: 0 }, // Reserved stock

    soldCount: { type: Number, default: 0 }, // Sold quantity

    threshold: { type: Number, default: 5 }, // Low stock alert

    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },

    updatedBy: { type: String, default: null },
  },
  {
    timestamps: true, // createdAt + updatedAt auto
    collection: 'Inventory',
  }
);

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);