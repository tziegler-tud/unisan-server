const mongoose = require('mongoose');

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
const Schema = mongoose.Schema;

// create instance of Schema
var UserGroupSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    allowedOperations: [
        {
            method: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            }
        }
    ],
});

UserGroupSchema.post('save', function(error, doc, next) {
    throw new Error(error);
});

UserGroupSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('UserGroup', UserGroupSchema);