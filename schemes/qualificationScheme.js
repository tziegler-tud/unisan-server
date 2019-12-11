const config = require('../config/config.json');
const mongoose = require('mongoose');

/** @typedef {{ qualType: string, name: string }} QualificationSchema */

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

const Schema = mongoose.Schema;
// create instance of Schema
var QualificationsSchema = new Schema({

    qualType: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
});


QualificationsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Qualifications',QualificationsSchema);