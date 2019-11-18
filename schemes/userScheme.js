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

const Schema = mongoose.Schema;
// create instance of Schema
var UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    hash: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
    },
    qualification: [
        {
            name: String,
            aquiredDate: Date,
            expireDate: Date,
            trainingDate: Date,
            isValid: Boolean,
            hasDocument: Boolean,
            documentPath: String
        }
    ],
    hasPhoto: {
        type: Boolean,
        default: false
    },
    isDisplayedOnPublic: {
        type: Boolean,
        default: false
    },
    loginEnabled: {
        type: Boolean,
        default: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});


UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);