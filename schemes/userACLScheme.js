const mongoose = require('mongoose');

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
const Schema = mongoose.Schema;

// create instance of Schema
var UserACLSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId, ref: 'User'
    },
    userRole: {
        type: String,
        default: "member"
    },
    userGroups: [{
        type: Schema.Types.ObjectId, ref: 'userGroup'
    }],
    individual: {
        events: [{
            type: Schema.Types.ObjectId, ref: 'Event'
        }],
    }
});

UserACLSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('UserACL', UserACLSchema);