const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const VenderSchema = new Schema({
    VUserId: { type: String, unique: true, required: true },
    VUserPass: { type: String, required: true },
    VenderName: { type: String, required: true },
    VAddress: { type: String },
    VContact: { type: Number },
    VEmail: { type: String, unique: true, required: true },
    VPicName: { type: String, default: "" },
    Vid: { type: String, unique: true, required: true },
    Status: { type: String, default: "Inactive" }

},
    { collection: "Vender" }
);

module.exports=mongoose.model("Vender",VenderSchema);
