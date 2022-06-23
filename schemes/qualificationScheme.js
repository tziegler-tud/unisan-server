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

QualificationsSchema.virtual('index').get(function() {
    switch(this.qualType) {
        case "Einsatzführung":
            return 0;
        case "Sanitätsdienst":
            return 1;
        case "Ausbildung":
            return 2;
        case "Nachweis":
            return 3;
        default:
            return 4;
    }
});

QualificationsSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Qualifications',QualificationsSchema);