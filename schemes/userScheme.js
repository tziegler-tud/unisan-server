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
    generalData: {
        //TODO: create db getter
        firstName: {
            title: {
                type: String,
                required: true
            },
            value: {
                type: String,
                required: true
            },
        },
        lastName: {
            title: {
                type: String,
                required: true
            },
            value: {
                type: String,
                required: true
            },
        },
        memberId: {
            title: {
                type: String,
                required: true
            },
            value: {
                type: String,
            },
        },
        customData: [
            {
                title: {
                    type: String,
                },
                value: {
                    type: String,
                }
            }

        ],
    },
    contactData: [{
        type: {
            // email, phone, etc...
            type: String,
        },
        title: {
            type: String,
        },
        annotation: {
            type: String,
        },
        value: {

        },
    }],

    otherData: {
        customData: [{
            title: {
                type: String,
            },
            value: {
                type: String,
            }
        }]
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
    },
});

UserSchema.post('save', function(error, doc, next) {
    throw new Error(error);
});


UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);