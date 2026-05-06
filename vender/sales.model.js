const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const SalesSchema = new Schema(
    {
        venderId: { type: Number, required: true },
        productId: { type: Number, required: true },
        quantity: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
        billid: { type: Number, required: true },

        date: {
            type: Date,
            default: Date.now,
            set: (val) => {
                if (typeof val === "string") {
                    const [day, month, year] = val.split("-");
                    return new Date(`${year}-${month}-${day}`);
                }
                return val;
            }
        }
    },
    {
        collection: "Sales"
    }
);

module.exports = mongoose.model("Sale", SalesSchema);