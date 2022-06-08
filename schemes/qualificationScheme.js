const mongoose = require('mongoose');

/** @typedef {{ qualType: string, name: string }} QualificationSchema */

const Schema = mongoose.Schema;
// create instance of Schema
var QualificationsSchema = new Schema({

    qualType: {
        type: String,
        required: true
    },
    typeIdentifier: {
        type: Number,
        default: 0,
    },
    level: {
        type: Number,
        default: 0,
    },
    name: {
        type: String,
        required: true
    },
    short: {
        type: String,
        default: this.name,
    }
});


QualificationsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Qualifications',QualificationsSchema);