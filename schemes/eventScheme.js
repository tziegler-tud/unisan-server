const mongoose = require('mongoose');

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: {title: string, value: string}, description: {shortDesc: string, longDesc: string}, date: {startDate: Date, endDate: Date}, participants: User[], createdDate: Date}} EventScheme */

const Schema = mongoose.Schema;

// create instance of Schema
var EventSchema = new Schema({
    title: {
        title: {
            type: String,
            required: true,
        },
        value: {
            type: String,
            required: true,
        }
    },
    type: {
        title: {
            type: String,
            default: "Typ",
        },
        value: {

        },
    },
    description: {
        shortDesc: {
            type: String,
        },
        longDesc: {
            type: String,
        },
    },
    date: {
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
            default: Date.now,
        },
    },
    participants: [
        {
            type: Schema.Types.ObjectId, ref: 'User'
        }
    ],
    createdDate: {
        type: Date,
        default: Date.now
    },
});

EventSchema.post('save', function(error, doc, next) {
    throw new Error(error);
});

EventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Event', EventSchema);
