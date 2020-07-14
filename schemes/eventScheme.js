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

EventSchema.virtual('dateRangeString').get(function() {
    var startDate = this.date.startDate;
    var endDate = this.date.endDate;

    var dateString;

    function wrapTime(timeString){
        if(parseInt(timeString) < 10){
            return "0" + timeString;
        }
        else return timeString
    }
    // check if startDate and EndDate is the same day
    if (startDate.getFullYear() === endDate.getFullYear()){
        if (startDate.getMonth() === endDate.getMonth()){
            if (startDate.getDate() === endDate.getDate()){
                //event ends the same day it started. Make output dd.mm.yyyy hh:mm - hh:mm
                dateString = wrapTime(startDate.getDate()) + "." + wrapTime(startDate.getMonth()+1) + "." + startDate.getFullYear() + " " + wrapTime(startDate.getHours()) + ":" + wrapTime(startDate.getMinutes()) + " - " + wrapTime(endDate.getHours()) + ":" + wrapTime(endDate.getMinutes());
            }
        }
    }
    else {
        //event ends a different day as it started. Make output dd.mm.yyyy hh:mm - dd.mm.yyyy hh:mm
        dateString = dateString = wrapTime(startDate.getDate()) + "." + wrapTime(startDate.getMonth()+1) + "." + startDate.getFullYear() + " " + wrapTime(startDate.getHours()) + ":" + wrapTime(startDate.getMinutes()) + " - " + wrapTime(endDate.getDate()) + "." + wrapTime(endDate.getMonth()+1) + "." + startDate.getFullYear() + " "+ wrapTime(endDate.getHours()) + ":" + wrapTime(endDate.getMinutes());
    }
    return dateString;
});

EventSchema.post('save', function(error, doc, next) {
    throw new Error(error);
});

EventSchema.set('toJSON', { virtuals: true, getters: true });

module.exports = mongoose.model('Event', EventSchema);
