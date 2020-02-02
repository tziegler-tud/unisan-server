const mongoose = require('mongoose');

/** @typedef {{ name: string, qualType: string, acquiredDate: Date, expireDate: Date, trainingDate: Date, isValid: boolean, hasDocument: boolean, documentPath: string }} QualificationObject */
/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */

const Schema = mongoose.Schema;

// create instance of Schema
var UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
    },
    generalData: {

        memberId: {
            type: String,
        },

        phone: {
            type: String,
        },
    },

    customData: {

    },
    hash: {
        type: String,
        required: true,
    },

    qualifications: [
        {
            qualification: {
                qualType: {
                    type: String,

                },
                name: {
                    type: String,

                },
            },
            acquiredDate: Date,
            expireDate: Date,
            trainingDate: Date,
            isValid: Boolean,
            hasDocument: Boolean,
            documentPath: String
        }
    ],
    hasPhoto: {
        type: Boolean,
        default: false
    },
    isDisplayedOnPublic: {
        type: Boolean,
        default: false
    },
    loginEnabled: {
        type: Boolean,
        default: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});


UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);