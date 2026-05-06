var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ProductCatg = new Schema({
    pcatgid: { 
        type: Number, 
        required: true, 
        unique: true 
    },
    pcatgname: { 
        type: String, 
        required: true, 
        unique: true 
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    }
},
{
    collection: 'Productcatg',
    timestamps: true
});

module.exports = mongoose.model('Productcatg', ProductCatg);