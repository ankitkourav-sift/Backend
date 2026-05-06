const express = require("express");
const customerRoute = express.Router();
const Customer = require("./customer.model");


const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

// ================= IMAGE FOLDER =================
const imageDir = path.join(__dirname, "rahulimage");

// ensure folder exists
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

// ================= MULTER CONFIG =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// ================= EMAIL =================
// ================= EMAIL SETUP =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "rr9595371@gmail.com",        // apna gmail
    pass: "dhyfabfervqrkqcu",           // app password
  },
});

// ================= SEND REGISTRATION MAIL =================
function sendGMail(mailto) {
  return transporter.sendMail({
    from: "rr9595371@gmail.com",
    to: mailto,
    subject: "Registration Success",
    text: "Your registration is successful. Wait for admin approval.",
  });
}
// ================= REGISTER =================
customerRoute.post("/register", upload.single("file"), async (req, res) => {
  try {
    const customer = new Customer({
      ...req.body,
      CPicName: req.file ? req.file.filename : "",
    });

    await customer.save();
    sendGMail(req.body.CEmail);

    res.json({ message: "Registration successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
              
// ================= LOGIN =================
customerRoute.post("/login", async (req, res) => {
  try {
    const customer = await Customer.findOne({
      CUserId: req.body.CUserId,
      CUserPass: req.body.CUserPass,
    });

    if (!customer)
      return res.status(404).json({ message: "Invalid credentials" });

    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= GET IMAGE =================
customerRoute.get("/getimage/:cpicname", (req, res) => {
  const filePath = path.join(imageDir, req.params.cpicname);
  res.sendFile(filePath);
});

// ================= GET CUSTOMER DETAILS =================
customerRoute.get("/getcustomerdetails/:cid", async (req, res) => {
  try {
    const customer = await Customer.findOne({ Cid: req.params.cid });

    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LIST =================
customerRoute.get("/getcustomerlist", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= UPDATE PROFILE =================
customerRoute.put("/update/:cid", upload.single("file"), async (req, res) => {
  try {
    const customer = await Customer.findOne({ Cid: req.params.cid });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.CustomerName = req.body.CustomerName;
    customer.CAddress = req.body.CAddress;
    customer.CContact = req.body.CContact;
    customer.CEmail = req.body.CEmail;
    customer.CUserId = req.body.CUserId;
    customer.StId = req.body.StId;
    customer.CtId = req.body.CtId;

    // IMAGE UPDATE FIX
    if (req.file) {
      customer.CPicName = req.file.filename;
    }

    await customer.save();

    res.json({
      message: "Profile updated successfully",
      customer,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= CHANGE PASSWORD =================
customerRoute.post("/changepassword", async (req, res) => {
  try {
    const { CUserId, OldPassword, NewPassword } = req.body;

    const customer = await Customer.findOne({ CUserId });

    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    if (customer.CUserPass !== OldPassword)
      return res.status(400).json({ message: "Old password incorrect" });

    customer.CUserPass = NewPassword;
    await customer.save();

    res.json({ message: "Password changed successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= ACTIVATE/DEACTIVATE =================
customerRoute.put("/customermanage/:cid/:status", async (req, res) => {
  try {
    await Customer.updateOne(
      { Cid: req.params.cid },
      { Status: req.params.status }
    );

    res.json({ message: "Status updated" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
customerRoute.post("/forgotpassword/send-otp", async (req, res) => {
  try {
    const { CUserId } = req.body;

    const customer = await Customer.findOne({ CUserId });

    if (!customer)
      return res.status(404).json({ message: "User not found" });

    // 🔥 OTP GENERATE
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 🔥 SAVE IN DB
    customer.otp = otp;
    customer.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await customer.save();

    // 🔥 SEND EMAIL
    await transporter.sendMail({
      from: "YOUR_EMAIL@gmail.com",
      to: customer.CEmail,
      subject: "OTP for Password Reset",
      text: `Your OTP is: ${otp}`,
    });

    res.json({ message: "OTP sent to your email ✅" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error sending OTP ❌" });
  }
});
customerRoute.post("/forgotpassword/verify-otp", async (req, res) => {
  try {
    const { CUserId, OTP } = req.body;

    const customer = await Customer.findOne({ CUserId });

    if (!customer)
      return res.status(404).json({ message: "User not found" });

    if (customer.otp !== OTP)
      return res.status(400).json({ message: "Invalid OTP ❌" });

    if (customer.otpExpiry < new Date())
      return res.status(400).json({ message: "OTP expired ❌" });

    res.json({ message: "OTP verified successfully ✅" });

  } catch (err) {
    res.status(500).json({ message: "Error verifying OTP ❌" });
  }
});
customerRoute.post("/forgotpassword/change-password", async (req, res) => {
  try {
    const { CUserId, NewPassword } = req.body;

    const customer = await Customer.findOne({ CUserId });

    if (!customer)
      return res.status(404).json({ message: "User not found" });

    customer.CUserPass = NewPassword;

    // 🔥 CLEAR OTP
    customer.otp = "";
    customer.otpExpiry = null;

    await customer.save();

    res.json({ message: "Password changed successfully ✅" });

  } catch (err) {
    res.status(500).json({ message: "Error changing password ❌" });
  }
});

module.exports = customerRoute;