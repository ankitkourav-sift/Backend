const express = require("express");
const productRoute = express.Router();

const Product = require("./product.model");

const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const { createInventoryForNewProduct } = require("./inventory.route");

require("dotenv").config();

// ================= CLOUDINARY =================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// ================= STORAGE =================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product_images",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

// ================= ADD PRODUCT =================
productRoute.post("/saveproductimage", upload.single("file"), async (req, res) => {
  try {
    const lastProduct = await Product.findOne().sort({ pid: -1 });
    const newPid = lastProduct ? lastProduct.pid + 1 : 1;

    const product = new Product({
      pid: newPid,
      pname: req.body.pname,
      pprice: req.body.pprice,
      oprice: req.body.oprice,
      pcatgid: req.body.pcatgid,
      vid: req.body.vid,
      status: "Active",
      ppicname: req.file ? req.file.path : "", // ✅ Cloudinary URL
    });

    await product.save();

    await createInventoryForNewProduct(product.pid, product.vid, 0, {
      updatedBy: product.vid,
    });

    res.json({ message: "Product added", product });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});
// ================= GET ALL PRODUCT IMAGES =================
productRoute.get("/getproductimages", async (req, res) => {
  try {
    const products = await Product.find().select("ppicname");

    const images = products
      .map(p => p.ppicname)
      .filter(img => img); // remove empty

    res.json(images);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ================= GET =================
productRoute.get("/showproduct", async (req, res) => {
  res.send(await Product.find());
});

productRoute.get("/showproductbyvender/:vid", async (req, res) => {
  res.send(await Product.find({ vid: req.params.vid }));
});

// ✅ ADD THIS (CATEGORY FILTER)
productRoute.get("/showproductbycatgid/:pcatgid", async (req, res) => {
  res.send(await Product.find({ pcatgid: req.params.pcatgid }));
});

// ✅ ADD THIS (STATUS FILTER)
productRoute.get("/showproductstatus/:status", async (req, res) => {
  res.send(await Product.find({ status: req.params.status }));
});

// ================= UPDATE =================
productRoute.put("/updateproduct/:pid", upload.single("file"), async (req, res) => {
  try {
    let updateData = {
      pname: req.body.pname,
      pprice: req.body.pprice,
      oprice: req.body.oprice,
      pcatgid: req.body.pcatgid,
      vid: req.body.vid,
      status: req.body.status,
    };

    if (req.file) {
      updateData.ppicname = req.file.path;
    }

    await Product.updateOne({ pid: req.params.pid }, { $set: updateData });

    res.json({ message: "Updated" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DELETE / STATUS =================
productRoute.put("/updateproductstatus/:pid/:status", async (req, res) => {
  await Product.updateOne(
    { pid: req.params.pid },
    { $set: { status: req.params.status } }
  );
  res.send("Status updated");
});

module.exports = productRoute;