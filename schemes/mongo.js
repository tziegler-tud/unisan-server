const config = require('../config/config.json');
const mongoose = require('mongoose');
const autoIncrement = require('mongoose-plugin-autoinc-fix');

mongoose.set('debug', true);
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

var opt = {
    user: config.username,
    pass: config.pwd,
    auth: {
        authSource: config.authSource
    },
    useCreateIndex: true,
    useNewUrlParser: true
};

const optLocalDb = {
    useCreateIndex: true,
    useNewUrlParser: true
};

// mongoose.connect(config.connectionString,opt);  // use this for remote database
const connection = mongoose.connect("mongodb://localhost:27017/unisan-test", optLocalDb);  // use this for locale database
mongoose.Promise = global.Promise;

module.exports = {
    User: require('./userScheme'),
    Qualifications: require('./qualificationScheme'),
    UserDataset: require('./userDatasetScheme'),
    Event: require('./eventScheme'),
    UserGroup: require('./userGroupScheme'),
    Log: require('./logScheme'),
    Protocol: require('./protocolScheme'),
};