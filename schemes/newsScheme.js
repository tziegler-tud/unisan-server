import mongoose from "mongoose";
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
const Schema = mongoose.Schema;

// create instance of Schema
var NewsScheme = new Schema({
    title: {
        value: {
            type: String,
            required: true,
        },
        delta: {
        },
        html: {
            type: String,
        }
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
        html: {
            type: String,
        }
    },
    tags: [
        {
            type: String
        }
    ],
    created: {
        type: Date,
        default: Date.now,
    },
    modified: {
        type: Date,
    }
});

// NewsScheme.virtual('content.html').get(function() {
//     if (this.content === undefined) return "";
//     if (this.content.delta === undefined) return "";
//
//     let delta = this.content.delta;
//     if (delta === undefined) return "";
//     var converter = new QuillDeltaToHtmlConverter(delta, {});
//     return converter.convert();
// });
//
// NewsScheme.virtual('title.html').get(function() {
//     let delta = this.title.delta;
//     if (delta === undefined) return "";
//     var converter = new QuillDeltaToHtmlConverter(delta, {});
//     return converter.convert();
// });

NewsScheme.pre('save', function(next){
    this.title.html = convertDelta(this.title.delta);
    this.content.html = convertDelta(this.content.delta);

    function convertDelta(delta) {
        if (delta === undefined || delta.ops === undefined) return "";
        var converter = new QuillDeltaToHtmlConverter(delta.ops, {});
        return converter.convert();
    }
    next()
})

NewsScheme.post('save', function(error, doc, next) {
    throw new Error(error);
});

NewsScheme.set('toJSON', { virtuals: true });

export default mongoose.model('News', NewsScheme);