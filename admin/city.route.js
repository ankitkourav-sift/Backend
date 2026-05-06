const express = require('express');
const cityRoute = express.Router();

var City = require('./city.model');

// save city
cityRoute.route('/save').post((req, res) => {

    var city = new City(req.body);

    city.save().then(() => {
        res.send("City saved successfully");
    }).catch(err => {
        res.send(err);
    });

});


// search city
cityRoute.route('/search/:ctid').get((req, res) => {

    City.findOne({ "ctid": req.params.ctid })
        .then(city => {
            res.send(city);
        }).catch(err => {
            res.send(err);
        });

});

// update city
cityRoute.route('/update').put((req, res) => {

    City.updateOne(
        { "ctid": req.body.ctid },
        { "ctname": req.body.ctname, "stid": req.body.stid }
    ).then(() => {
        res.send("City updated successfully");
    }).catch(err => {
        res.send(err);
    });

});

// delete / disable city
cityRoute.route('/delete/:ctid').delete((req, res) => {

    City.updateOne(
        { "ctid": req.params.ctid },
        { "status": 0 }
    ).then(() => {
        res.send("City disabled successfully");
    }).catch(err => {
        res.send(err);
    });

});

// show active cities
cityRoute.route('/show').get((req, res) => {

    City.find({ "status": 1 })
        .then(city => {
            res.send(city);
        }).catch(err => {
            res.send(err);
        });

});

// show cities by state
cityRoute.route('/showcitybystate/:stid').get((req, res) => {

    City.find({
        $and: [
            { "status": 1 },
            { "stid": req.params.stid }
        ]
    }).then(city => {
        res.send(city);
    }).catch(err => {
        res.send(err);
    });

});

// show all cities
cityRoute.route('/getall').get((req, res) => {

    City.find()
        .then(city => {
            res.send(city);
        }).catch(err => {
            res.send(err);
        });

});

// search city by name
cityRoute.route('/searchbyname/:ctname').get((req, res) => {

    City.findOne({ "ctname": req.params.ctname })
        .then(city => {
            res.send(city);
        }).catch(err => {
            res.send(err);
        });

});

module.exports = cityRoute;