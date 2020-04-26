const mongoose = require('mongoose');

/** @typedef {{ qualType: string, name: string }} UserDatasetSchema */

const Schema = mongoose.Schema;
// create instance of Schema
var UserDatasetSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
    isArray: {
        type: Boolean,
        default: false,
    },
    children: [
        {
            type: Schema.Types.ObjectId, ref: 'UserDataset'
        }
    ]
});

UserDatasetSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('UserDataset',UserDatasetSchema);