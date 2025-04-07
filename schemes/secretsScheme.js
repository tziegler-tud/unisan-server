import mongoose from "mongoose";
const Schema = mongoose.Schema;

var SecretsScheme = new Schema({
    key: { type: String },
    value: {

    },
    created: {
        type: Date,
        default: Date.now,
    },
    modified: {
        type: Date,
    }
});


// NewsScheme.virtual('title.html').get(function() {
//     let delta = this.title.delta;
//     if (delta === undefined) return "";
//     var converter = new QuillDeltaToHtmlConverter(delta, {});
//     return converter.convert();
// });

SecretsScheme.pre('save', function(next){
    this.modified = Date.now;
    next()
})

// NewsScheme.post('save', function(error, doc, next) {
//     throw new Error(error);
// });

SecretsScheme.set('toJSON', { virtuals: true });

export default mongoose.model('Secrets', SecretsScheme);