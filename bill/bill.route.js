const express = require("express");
const router = express.Router();
const Bill = require("./bill.model");

// ================= SAVE BILL =================
router.post("/billsave", async (req, res) => {
  try {
    const bill = new Bill({
      billid: req.body.billid,
      cid: String(req.body.cid),   // ✅ IMPORTANT
      billdate: req.body.billdate,
      pid: req.body.pid,
      Qty: req.body.qty,
      total: req.body.total || 0,
    });

    await bill.save();
    res.json({ message: "Bill saved" });

  } catch (err) {
    res.status(500).json(err);
  }
});

// ================= BILL IDS =================
router.get("/billshowbillids/:cid", async (req, res) => {
  try {
    const data = await Bill.find({ cid: req.params.cid }); // ✅ FIXED
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ================= BILL DATES =================
router.get("/billshowbilldates/:cid", async (req, res) => {
  try {
    const data = await Bill.find({ cid: req.params.cid }).select("billdate billid");
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ================= BILL BY ID =================
router.get("/showbillbyid/:billid", async (req, res) => {
  try {
    const data = await Bill.find({ billid: req.params.billid });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ================= BILL BY DATE =================
router.get("/showbillbydate/:date", async (req, res) => {
  try {
    const data = await Bill.find({ billdate: req.params.date });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});
//all bill ids
router.get("/allbillids", async (req, res) => {
  try {
    const bills = await Bill.distinct("billid"); // ✅ NO DUPLICATES
    res.json(bills);
  } catch (err) {
    res.status(500).json(err);
  }
});
//update status
// ================= UPDATE STATUS =================
router.put("/updatestatus", async (req, res) => {
  try {
    const { billid, status, updatedBy } = req.body;

    await Bill.updateMany(
      { billid: billid },
      {
        $set: {
          status: status,
          updatedBy: updatedBy,
          updatedAt: new Date(),
        },
      }
    );

    res.json({ message: "Status updated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating status" });
  }
});
// ================= GET STATUS =================
router.get("/getstatus/:billid", async (req, res) => {
  try {
    const bill = await Bill.findOne({ billid: req.params.billid });

    res.json({
      status: bill?.status || "Processing",
      updatedAt: bill?.updatedAt || null,
      updatedBy: bill?.updatedBy || "N/A",
    });

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;