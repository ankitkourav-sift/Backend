
    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    const Customer = new Schema({
          CUserId : {type:String,unique:true},
          CUserPass :{type:String},
          CustomerName:{type:String},
          StId:{type:Number},
          CtId:{type:Number},
          CAddress:{type:String},
          CContact : {type:Number},
          CEmail:{type:String,unique:true},
          CPicName:{type:String},
          Cid:{type:Number},
          Status:{type:String},
          otp:{type:String},
          otpExpiry:{type:Date},

    },
{
           collection:"Customer"
})
 
module.exports = mongoose.model("Customer",Customer);