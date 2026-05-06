const express = require('express');
const router = express.Router();

const Sale = require('./sales.model');
const Product = require('../product/product.model');
const Inventory = require("../product/inventory.model");

// ======================
// ADD SALE (FIXED)
// ======================
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity, venderId } = req.body;

    console.log("🔥 SALE API HIT");

    // 🔍 check inventory
    const inv = await Inventory.findOne({
      pid: Number(productId),
      vid: Number(venderId)
    });

    if (!inv) {
      return res.status(400).json({ message: "Inventory not found" });
    }

    if (inv.stock < quantity) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    // ✅ save sale
    const sale = new Sale(req.body);
    await sale.save();

    // ✅ update inventory
    inv.stock -= Number(quantity);
    inv.soldCount += Number(quantity);

    await inv.save();

    console.log("BEFORE/AFTER STOCK:", inv.stock);

    res.json({ message: "Sale + Inventory updated", sale });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


// ======================
// GET SALES BY VENDOR (FIXED)
// ======================
router.get("/vender/:venderId", async (req, res) => {
  try {

    const sales = await Sale.find({
      venderId: Number(req.params.venderId)
    }).sort({ date: -1 });

    const productIds = sales.map(s => Number(s.productId));

    const products = await Product.find({
      pid: { $in: productIds }
    });

    // ✅ FAST mapping
    const productMap = {};
    products.forEach(p => {
      productMap[Number(p.pid)] = p;
    });

    const salesWithProducts = sales.map(sale => {
      const product = productMap[Number(sale.productId)];

      return {
        ...sale._doc,
        productDetails: product
          ? {
              pname: product.pname,
              oprice: product.oprice,
              pprice: product.pprice,
              ppicname: product.ppicname
            }
          : null
      };
    });

    res.json(salesWithProducts);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;