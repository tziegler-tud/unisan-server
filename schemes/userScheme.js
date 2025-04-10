import mongoose from "mongoose";


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
    internalEmail: {
        type: String,
        unique: true,
        trim: true,
    },
    mail: {
        applicationToken: {
            type: String,
        },
        senderName: {
            type: String,
            default: function(){
                return (this.generalData.firstName.value + " " + this.generalData.lastName.value)
            },
        }
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
        default: {
            type: Boolean,
            required: true,
            default: false,
        }
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
                type: Schema.Types.ObjectId,
                ref: 'Qualifications',
            },
            acquiredDate: {
                type: Date,
                set: transformDate,
            },
            expireDate: {
                type: Date,
                set: transformDate,
            },
            trainingDate: {
                type: Date,
                set: transformDate,
            },
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
    privacyAgreement: {
        type: Boolean,
        default: false,
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
});

function transformDate(v) {
    if (v === "") {
        return undefined;
    }
    else return v;
}

UserSchema.post('save', function(error, doc, next) {
    throw new Error(error);
});

UserSchema.set('toJSON', { virtuals: true });



UserSchema.virtual('name').get(function() {
    if (this.generalData.firstName === undefined || this.generalData.lastName === undefined) return "";
    return (this.generalData.firstName.value + " " + this.generalData.lastName.value);
});

UserSchema.virtual('contactDefault').get(function() {
    let obj;
    if (this.contactData === undefined) return "";
    return this.contactData.find(function(contactDataObject){
        return contactDataObject.default;
    })
});

export default mongoose.model('User', UserSchema);