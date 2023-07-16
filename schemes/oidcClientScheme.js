import mongoose from "mongoose";

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
const Schema = mongoose.Schema;

// create instance of Schema
var OidcClientScheme = new Schema({
    name: {
        type: String,
        required: true,
    },
    client_id: {
        type: String,
        required: true,
        unique: true,
    },
    client_secret: {
        type: String,
        required: true,
    },
    redirect_uris: [
        {
            type: String,
        }
    ],
    createdDate: {
        type: Date,
        default: Date.now()
    },
    enabled: {
        type: Boolean,
        default: true,
    },
    post_logout_redirect_uris: [
        {
            type: String,
        }
    ],
});

OidcClientScheme.post('save', function(error, doc, next) {
    throw new Error(error);
});

OidcClientScheme.set('toJSON', { virtuals: true });

export default mongoose.model('OidcClient', OidcClientScheme);