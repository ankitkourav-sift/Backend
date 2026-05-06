const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require("path");

require("dotenv").config();

// ================= ROUTES =================
const salesRoute = require("./vender/sales.route.js");
const billRoute = require("./bill/bill.route.js");
const paymentRoute = require("./payment/payment.route.js");

const stateRoute = require('./admin/state.route.js');
const cityRoute = require('./admin/city.route.js');
const productCatgRoute = require('./admin/productcatg.route.js');

const productRoute = require('./product/product.route.js');
const inventoryRoutes = require('./product/inventory.route.js');
const venderRoute = require('./vender/vender.route.js');
const customerRoute = require("./customer/customer.route.js");
const orderRoute = require("./order/order.route.js");

// ================= MIDDLEWARE =================
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ================= STATIC (IMPORTANT FIX) =================
// 👉 ONLY IMAGE FOLDER SERVE KARO
app.use(
  "/customer-images",
  express.static(path.join(__dirname, "customer/rahulimage"))
);
console.log("salesRoute:", salesRoute);
console.log("billRoute:", billRoute);
console.log("paymentRoute:", paymentRoute);
console.log("stateRoute:", stateRoute);
console.log("cityRoute:", cityRoute);
console.log("productCatgRoute:", productCatgRoute);
console.log("productRoute:", productRoute);
console.log("inventoryRoutes:", inventoryRoutes);
console.log("venderRoute:", venderRoute);
console.log("customerRoute:", customerRoute);
console.log("orderRoute:", orderRoute);

// ================= ROUTE USE =================
app.use("/sales", salesRoute);
app.use("/bill", billRoute);
app.use("/payment", paymentRoute);

app.use("/state", stateRoute);
app.use("/city", cityRoute);
app.use("/productcatg", productCatgRoute);
app.use("/vender", venderRoute);
app.use("/product", productRoute);
app.use("/inventory", inventoryRoutes);
app.use("/customer", customerRoute);

// ⭐ ORDER SYSTEM
app.use("/order", orderRoute);

// ================= TEST =================
app.get("/", (req, res) => {
    res.send("API working fine");
});

// ================= DB =================
mongoose.connect(process.env.MONGODB_ATLAS_URL)
.then(() => console.log('DB connected'))
.catch(err => console.log(err));

// ================= SERVER =================
const PORT = process.env.PORT || 9292;
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

module.exports = app;