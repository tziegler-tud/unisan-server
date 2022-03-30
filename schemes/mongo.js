const config = require('../config/config.json');
const mongoose = require('mongoose');
const autoIncrement = require('mongoose-plugin-autoinc-fix');

mongoose.set('debug', false);

var opt = {
    user: config.username,
    pass: config.pwd,
    auth: {
        authSource: config.authSource
    },
};

const optLocalDb = {
    useCreateIndex: true,
    useNewUrlParser: true
};


mongoose.connect(config.connectionString,opt);  // use this for remote database
// const connection = mongoose.connect("mongodb://localhost:27017/unisan-test", optLocalDb);  // use this for locale database
mongoose.Promise = global.Promise;

module.exports = {
    User: require('./userScheme'),
    Qualifications: require('./qualificationScheme'),
    UserDataset: require('./userDatasetScheme'),
    Event: require('./eventScheme'),
    UserGroup: require('./userGroupScheme'),
    UserACL: require('./userACLScheme'),
    Log: require('./logScheme'),
    Protocol: require('./protocolScheme'),
};