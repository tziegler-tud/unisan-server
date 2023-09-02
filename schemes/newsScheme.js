import mongoose from "mongoose";

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
const Schema = mongoose.Schema;

// create instance of Schema
var NewsScheme = new Schema({
    title: {
        type: String,
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    content: {
        delta: {

        },
        value: {
            type: String,
        },
    },
    tags: [
        {
            type: String
        }
    ],
    created: {
        type: Date,
        default: Date.now(),
    },
    modified: {
        type: Date,
    }
});

NewsScheme.post('save', function(error, doc, next) {
    throw new Error(error);
});

NewsScheme.set('toJSON', { virtuals: true });

export default mongoose.model('News', NewsScheme);