const mongoose = require('mongoose');

const { convertDeltaToHtml } = require('node-quill-converter');

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
        },
        delta: {

        }
    },
    type: {
        title: {
            type: String,
            default: "Typ",
        },
        value: {
            type: String,
        },
        raw: {
            type: String,
        }
    },
    description: {
        shortDesc: {
            title: {
                default: "Kurzbeschreibung",
                type: String,
            },
            value: {
                type: String
            },
            delta: {

            },
        },
        longDesc: {
            title: {
                type: String,
                default: "Beschreibung",
            },
            delta: {

            },
            value: {
                type: String,
            },
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
    location: {
        title: {
            type: String,
            default: "Adresse",
        },
        value: {

        },
    },
    participants: [
        {
            user: {
                type: Schema.Types.ObjectId, ref: 'User'
            },
            role: {
                type: String,
                default: "participant"
            },
            lastChanged: {
                type: Date,
                default: Date.now,
            }
        }
    ],
    accessRights: {
        admin: [
            {
              type: Schema.Types.ObjectId,
              ref: 'User',
            }
        ],
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
});

function wrapTime(timeString){
    if(parseInt(timeString) < 10){
        return "0" + timeString;
    }
    else return timeString
}

function extractDateString(date){
    return wrapTime(date.getDate()) + "." + wrapTime(date.getMonth()+1) + "." + date.getFullYear();
}

function extractTimeRangeString(startDate, endDate){
    return wrapTime(startDate.getHours()) + ":" + wrapTime(startDate.getMinutes()) + " - " + wrapTime(endDate.getHours()) + ":" + wrapTime(endDate.getMinutes())
}

EventSchema.virtual('date.startDateString').get(function() {
    return extractDateString(this.date.startDate);
});


EventSchema.virtual('date.endDateString').get(function() {
    return extractDateString(this.date.endDate);
});

EventSchema.virtual('date.timeString').get(function() {
    return extractTimeRangeString(this.date.startDate, this.date.endDate);
});


EventSchema.virtual('dateRangeString').get(function() {

    var startDate = this.date.startDate;
    var endDate = this.date.endDate;

    //check if date is available
    if(startDate === undefined || endDate === undefined){
        return "";
    }

    var dateString;

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

EventSchema.virtual('description.longDesc.html').get(function() {

    let delta = this.description.longDesc.delta;
    if (delta === undefined) return "";
    let htmlContent =  convertDeltaToHtml(delta);
    return htmlContent;
});

EventSchema.virtual('title.html').get(function() {
    let delta = this.title.delta;
    if (delta === undefined) return "";
    return convertDeltaToHtml(delta);
});

EventSchema.post('save', function(error, doc, next) {
    throw new Error(error);
});

EventSchema.set('toJSON', { virtuals: true, getters: true });

module.exports = mongoose.model('Event', EventSchema);
