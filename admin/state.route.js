const express = require('express');
const stateRoute = express.Router();
var State = require('./state.model');

// save state
stateRoute.route('/save').post((req, res) => {

    var state = new State(req.body);

    state.save().then(() => {
        res.send("State saved successfully");
    }).catch(err => {
        res.send(err);
    });

});

// search state by id
stateRoute.route('/search/:stid').get((req, res) => {

    State.findOne({ "stid": req.params.stid })
        .then(state => {
            res.send(state);
        }).catch(err => {
            res.send(err);
        });

});

// update state
stateRoute.route('/update').put((req, res) => {

    State.updateOne(
        { "stid": req.body.stid },
        { "stname": req.body.stname, "status": req.body.status }
    ).then(() => {
        res.send("State updated successfully");
    }).catch(err => {
        res.send(err);
    });

});

// delete / disable state
stateRoute.route('/delete/:stid').delete((req, res) => {

    State.updateOne(
        { "stid": req.params.stid },
        { "status": 0 }
    ).then(() => {
        res.send("State disabled successfully");
    }).catch(err => {
        res.send(err);
    });

});

// show active states
stateRoute.route('/show').get((req, res) => {

    State.find({ "status": 1 })
        .then(state => {
            res.send(state);
        }).catch(err => {
            res.send(err);
        });

});

// show all states
stateRoute.route('/getall').get((req, res) => {

    State.find()
        .then(state => {
            res.send(state);
        }).catch(err => {
            res.send(err);
        });

});

// search by name
stateRoute.route('/searchbyname/:stname').get((req, res) => {

    State.findOne({ "stname": req.params.stname })
        .then(state => {
            res.send(state);
        }).catch(err => {
            res.send(err);
        });

});

module.exports = stateRoute;