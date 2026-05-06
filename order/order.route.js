const express = require("express");
const router = express.Router();
const Order = require("./order.model");

// ================= SAVE ORDER =================
router.post("/payment-success", async (req, res) => {
  try {
    const data = req.body;

    const total = (data.items || []).reduce(
      (sum, item) => sum + (item.qty || 0) * (item.price || 0),
      0
    );

    const order = new Order({
      cid: String(data.cid),
      billid: data.billid,
      items: data.items || [],
      total,
      paymentId: data.razorpayPaymentId,
      orderId: data.razorpayOrderId,
      status: "Processing",
    });

    await order.save();

    res.json({ message: "Order saved successfully", order });

  } catch (err) {
    console.log("ORDER ERROR:", err);
    res.status(500).json(err);
  }
});


// ================= GET ORDERS BY CUSTOMER =================
router.get("/getorders/:cid", async (req, res) => {
  try {
    const data = await Order.find(); // ❌ NO FILTER (ALL DATA)

    console.log("ALL ORDERS:", data);

    res.json(data || []);
  } catch (err) {
    console.log(err);
    res.status(500).json([]);
  }
});
// ================= GET SINGLE ORDER =================
router.get("/getorder/:billid", async (req, res) => {
  try {
    const data = await Order.findOne({ billid: req.params.billid });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;