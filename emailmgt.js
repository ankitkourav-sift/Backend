// execute belw command in terminal
// >npm install nodemailer

const nodemailer = require("nodemailer");
const express = require("express");
const emailrouter = express.Router();

emailrouter.post("/sendemails/:mailto/:subject/:message",async(req,res) => {
    try{

        res.status(200).json({response:"Mail sent"});

        const transporter  = nodemailer.createTransport({
            service:"gmail",
            port:465,
            secure:true,
            auth: {
                user:"rr9595371@gmail.com",
                pass:"dhyfabfervqrkqcu",
            },
        });
            console.log(req.params.mailto);
            const mailOptions = {
                from: "rr9595371@gmail.com",
                to: req.params.mailto,
                subject:req.params.subject,
                text:req.params.message,
            };

            transporter.sendMail(mailOptions,(error,info) => {
                if(error){
                    console.error("Error sending email: ", error)
                }else{
                    console.log("Email sent: ",info.response);
                }
            });
    }catch(error){
        res.status(500).json({error});
    }
});
module.exports = emailrouter;