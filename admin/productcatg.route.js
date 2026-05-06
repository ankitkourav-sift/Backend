const express = require('express');
const productcatgRoute = express.Router();

var Productcatg = require('./productcatg.model');

// add product category
productcatgRoute.route('/addproductcatg/:pcatgid/:pcatgname').post((req, res) => {

    var productcatg = new Productcatg({
        pcatgid: req.params.pcatgid,
        pcatgname: req.params.pcatgname
    });

    productcatg.save().then(() => {
        res.send('Product category added successfully');
    }).catch(err => {
        res.send(err);
    });

});

// show all product category
productcatgRoute.route('/showproductcatg').get((req, res) => {

    Productcatg.find()
        .then(productcatg => {
            res.send(productcatg);
        }).catch(err => {
            res.send(err);
        });

});

// update product category
productcatgRoute.route('/updateproductcatg/:pcatgid/:pcatgname').put((req, res) => {

    Productcatg.updateOne(
        { "pcatgid": req.params.pcatgid },
        { "pcatgname": req.params.pcatgname }
    ).then(() => {
        res.send('Product category updated successfully');
    }).catch(err => {
        res.send(err);
    });

});

module.exports = productcatgRoute;