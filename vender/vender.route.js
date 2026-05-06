const express = require("express");
const venderRoute = express.Router();
const Vender = require("./vender.model");

const multer = require("multer");
const nodemailer = require("nodemailer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

require("dotenv").config();


// ================= CLOUDINARY =================
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET
});


// ================= STORAGE =================
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "vendor_images",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
        public_id: (req, file) => Date.now() + "-" + file.originalname
    }
});

const upload = multer({ storage });


// ================= REGISTER =================
venderRoute.post("/register", upload.single("file"), async (req, res) => {
    try {
        const exists = await Vender.findOne({
            $or: [
                { VUserId: req.body.VUserId },
                { VEmail: req.body.VEmail }
            ]
        });

        if (exists) {
            return res.status(400).send("VUserId or Email already exists");
        }

        const maxVidDoc = await Vender.findOne().sort({ Vid: -1 });
        const newVid = maxVidDoc ? maxVidDoc.Vid + 1 : 1;

        const vendor = new Vender({
            ...req.body,
            VPicName: req.file ? req.file.path : "",
            Vid: newVid
        });

        await vendor.save();

        res.send("Registration Successful");

    } catch (err) {
        console.log(err);
        res.status(500).send("Registration Failed");
    }
});


// ================= LOGIN =================
venderRoute.post("/login", async (req, res) => {
    const { vuid, vupass } = req.body;

    try {
        const vendor = await Vender.findOne({
            VUserId: vuid,
            VUserPass: vupass
        });

        if (!vendor) {
            return res.status(401).send("Invalid Credentials");
        }

        res.send(vendor);

    } catch (err) {
        res.status(500).send("Server Error");
    }
});


// ================= GET ALL =================
venderRoute.get("/getvendercount", async (req, res) => {
    try {
        const vendors = await Vender.find();
        res.send(vendors);
    } catch (err) {
        res.status(500).send("Server Error");
    }
});


// ================= STATUS UPDATE =================
venderRoute.put("/vendermanage/:vid/:status", async (req, res) => {
    try {
        await Vender.updateOne(
            { Vid: req.params.vid },
            { Status: req.params.status }
        );
        res.send("Vendor status updated");
    } catch (err) {
        res.status(500).send(err);
    }
});


// ================= UPDATE PROFILE =================
venderRoute.put("/update/:VUserId", async (req, res) => {
    try {
        const VUserId = req.params.VUserId;

        const vendor = await Vender.findOne({ VUserId });

        if (!vendor) {
            return res.status(404).send("Vendor not found");
        }

        const uploadMiddleware = upload.single("file");

        uploadMiddleware(req, res, async (err) => {
            if (err) {
                return res.status(500).send("File upload failed");
            }

            const updateData = {
                VenderName: req.body.VenderName || vendor.VenderName,
                VAddress: req.body.VAddress || vendor.VAddress,
                VContact: req.body.VContact || vendor.VContact,
                VEmail: req.body.VEmail || vendor.VEmail,
                VPicName: req.file ? req.file.path : vendor.VPicName
            };

            await Vender.updateOne(
                { VUserId },
                { $set: updateData }
            );

            res.send({
                message: "Profile updated successfully",
                updateData
            });
        });

    } catch (err) {
        res.status(500).send("Error updating profile");
    }
});


// ================= OTP STORE =================
let otpStore = {};


// ================= SEND OTP =================
venderRoute.post("/send-otp", async (req, res) => {
    try {
        const { VUserId } = req.body;

        const vendor = await Vender.findOne({ VUserId });

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[VUserId] = otp;

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: vendor.VEmail,
            subject: "Vendor Password Reset OTP",
            text: `Your OTP is ${otp}`
        });

        res.json({
            success: true,
            message: "OTP sent"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Error sending OTP"
        });
    }
});


// ================= RESET PASSWORD =================
venderRoute.post("/reset-password", async (req, res) => {
    try {
        const { VUserId, otp, newPassword } = req.body;

        if (!otpStore[VUserId] || otpStore[VUserId] !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        await Vender.updateOne(
            { VUserId },
            { $set: { VUserPass: newPassword } }
        );

        delete otpStore[VUserId];

        res.json({
            success: true,
            message: "Password reset successful"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Error resetting password"
        });
    }
});


// ================= CHANGE PASSWORD =================
venderRoute.post("/changepassword", async (req, res) => {
    try {
        const { VUserId, OldPassword, newPassword } = req.body;

        // 1. check fields
        if (!VUserId || !OldPassword || !newPassword) {
            return res.status(400).json({
                message: "All fields required"
            });
        }

        // 2. find vendor
        const vendor = await Vender.findOne({ VUserId });

        if (!vendor) {
            return res.status(404).json({
                message: "Vendor not found"
            });
        }

        // 3. check old password
        if (vendor.VUserPass !== OldPassword) {
            return res.status(400).json({
                message: "Old password incorrect"
            });
        }

        // 4. update password
        vendor.VUserPass = newPassword;
        await vendor.save();

        // 5. success
        res.json({
            message: "Password changed successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = venderRoute;