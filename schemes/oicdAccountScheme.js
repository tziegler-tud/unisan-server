import mongoose from "mongoose";

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
const Schema = mongoose.Schema;

// create instance of Schema
var OicdAccountScheme = new Schema({
    accountId: {
        required: true,
        type: String,
    },
    model: {

    },
    payload: {

    },
    grantId: {

    },
    userCode: {

    },
    session: {

    },
    uid: {

    },
    consumed: {

    },
    expiresAt: {

    },
    expireAfterSeconds: {
        type: Date,
    }
});

OicdAccountScheme.post('save', function(error, doc, next) {
    throw new Error(error);
});

OicdAccountScheme.set('toJSON', { virtuals: true });

export default mongoose.model('OicdAccount', OicdAccountScheme);