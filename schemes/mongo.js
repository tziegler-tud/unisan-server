const config = require('../config/config.json');
const mongoose = require('mongoose');

mongoose.set('debug', true);

var opt = {
    user: config.username,
    pass: config.pwd,
    auth: {
        authSource: config.authSource
    },
    useCreateIndex: true,
    useNewUrlParser: true
};

var optLocalDb = {
    useCreateIndex: true,
    useNewUrlParser: true
};

//mongoose.connect(config.connectionString,opt);  // use this for remote database
mongoose.connect("mongodb://localhost:27017/unisan-test", optLocalDb);  // use this for locale database
mongoose.Promise = global.Promise;

module.exports = {
    User: require('./userScheme'),
    Qualifications: require('./qualificationScheme')
};