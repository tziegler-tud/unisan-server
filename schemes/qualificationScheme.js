const mongoose = require('mongoose');

/** @typedef {{ qualType: string, name: string }} QualificationSchema */

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