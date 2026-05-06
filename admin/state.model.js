var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var State = new Schema({
    stid: { type: Number, required: true, unique: true },
    stname: { type: String, required: true, unique: true },
    status: { type: Number, required: true }
},
{
    collection: 'state'
});

module.exports = mongoose.model('state', State);