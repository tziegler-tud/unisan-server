const config = require('../config/config.json');
const mongoose = require('mongoose');

var opt = {
    user: config.username,
    pass: config.pwd,
    auth: {
        authSource: 'admin'
    },
    useCreateIndex: true,
    useNewUrlParser: true
};

mongoose.connect(config.connectionString, opt);
mongoose.Promise = global.Promise;

module.exports = {
    User: require('./userScheme'),
    Qualifications: require('./qualificationScheme')
};