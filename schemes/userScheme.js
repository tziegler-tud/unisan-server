const mongoose = require('mongoose');
const autoIncrement = require('mongoose-plugin-autoinc-fix');



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
                default: "Vorname",
            },
            value: {
                type: String,
                required: true
            },
        },
        lastName: {
            title: {
                type: String,
                default: "Nachname",
            },
            value: {
                type: String,
                required: true
            },
        },
        memberId: {
            title: {
                type: String,
                default: "Mitgliedsnummer",
            },
            value: {
                type: Number,
            },
        },
        customData: [
            {
                title: {
                    type: String,
                },
                value: {
                    type: String,
                },
                type: {
                    type: String,
                },
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

UserSchema.plugin(autoIncrement.plugin, { model: 'User', field: 'generalData.memberId.value', startAt: 30, incrementBy: 1});

UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);



/**
 * this resets the counter from  plugin. just run once at server startup or move to own function
 */
// let User = mongoose.model('User', UserSchema);
// let user = new User();
// user.save(err => {
//
//     // user._id === 100 -> true
//
//     user.nextCount().then(count => {
//
//         // count === 101 -> true
//
//         user.resetCount().then(nextCount => {
//
//             // nextCount === 100 -> true
//
//         });
//
//     });
//
// });
// module.exports = user;
