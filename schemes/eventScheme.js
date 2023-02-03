import mongoose from "mongoose";

import { convertDeltaToHtml } from 'node-quill-converter';
import humanFileSize from "../helpers/humanFileSize.js";

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: {title: string, value: string}, description: {shortDesc: string, longDesc: string}, date: {startDate: Date, endDate: Date}, participants: User[], createdDate: Date}} EventScheme */

const Schema = mongoose.Schema;
var FileReference = new Schema({
    filename: {
        type: String,
    },
    filetype: {
        type: String,
        default: "unset",
    },
    size: {
        type: Number,
    }

});

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
            type: String, //["Ausbildungsabend", "Seminar", "Sanitätswachdienst"]
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
    hasPostings: {
        type: Boolean,
        default: false,
    },
    postings: [
        {
            requiredQualifications: [{
                type: Schema.Types.ObjectId,
                ref: 'Qualifications',
            }],
            description: {
                type: String,
            },
            allowHigher: {
                type: Boolean,
                default: true,
            },
            date: {
                startDate: {
                    type: Date,
                    default: function(){
                        return this.parent().date.startDate;
                    }
                },
                endDate: {
                    type: Date,
                    default: function(){
                        return this.parent().date.endDate;
                    }
                }
            },
            enabled: {
                type: Boolean,
                default: true,
            },
            optional: {
                type: Boolean,
                default: false,
            },
            assigned: {
                isAssigned: {
                    type: Boolean,
                    default: false,
                },
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    default: undefined,
                },
                date: {
                    type: Date,
                    default: Date.now,
                }
            },
        }
    ],
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
            },
            date: {
                type: Date,
                default: Date.now,
            }
        }
    ],
    files: [FileReference],
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
    let date = this.date.startDate;
    return (date === undefined ? null : extractDateString(date));
});


EventSchema.virtual('date.endDateString').get(function() {
    let date = this.date.endDate;
    return (date === undefined ? null : extractDateString(date));
});

EventSchema.virtual('date.timeString').get(function() {
    var startDate = this.date.startDate;
    var endDate = this.date.endDate;
    //check if date is available
    if(startDate === undefined || endDate === undefined){
        return "";
    }
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
    if (this.description === undefined) return "";
    if (this.description.longDesc === undefined) return "";

    let delta = this.description.longDesc.delta;
    if (delta === undefined) return "";
    return convertDeltaToHtml(delta);
});

EventSchema.virtual('title.html').get(function() {
    let delta = this.title.delta;
    if (delta === undefined) return "";
    return convertDeltaToHtml(delta);
});

EventSchema.virtual('type.index').get(function() {
    let type = this.type.value;
    let index = 0;
    switch(type) {
        case "Ausbildungsabend":
            index = 1;
            break;
        case "Seminar":
            index = 2;
            break;
        case "Sanitätswachdienst":
            index = 3;
            break;
        default:
        case "Anderes":
            index = 0;
            break;
    }
    return index;
});

EventSchema.pre('save', function(next) {
    this.postings.forEach(posting => {
        posting.date.startDate = cleanTime(posting.date.startDate);
        posting.date.endDate = cleanTime(posting.date.endDate);
    })

    function cleanTime(date){
        let d = new Date(date);
        d.setSeconds(0);
        d.setMilliseconds(0)
        return d;
    }
    next();
});


FileReference.virtual('thumbnail').get(function(){
    let filetype = this.filetype;

    //boil down filetype to use for thumbnail generation
    //split mime-type into type/subtype
    let typeArr = filetype.split("/");
    let type = typeArr[0];
    let subtype = typeArr[1]
    let thumbnail = false;
    let thumbnailUrl = "";

    switch (type) {
        case "application":
            switch(subtype) {
                case "pdf":
                    thumbnailUrl = "/static/file-thumbnails/pdf.svg";
                    break;
                case "octet-stream":
                    thumbnailUrl = "/static/file-thumbnails/binary.svg";
                    break;
            }
            break;
        case "image":
            thumbnailUrl = this.filename;
            break;

        case "text":
            thumbnailUrl = "/static/file-thumbnails/text.svg";
            break;
        case "audio":
            thumbnailUrl = "/static/file-thumbnails/audio.svg";
            break;
        case "video":
            thumbnailUrl = "/static/file-thumbnails/video.svg";
            break;
        default:
            thumbnailUrl = "/static/file-thumbnails/binary.svg";
            break;
    }
    return thumbnailUrl;
})

FileReference.virtual("humanReadableFileSize").get(function(){
    if (!this.size) {
        return "unknown file size"
    }
    return humanFileSize(this.size, true);
})

EventSchema.post('save', function(error, doc, next) {
    throw new Error(error);
});

EventSchema.set('toJSON', { virtuals: true, getters: true });
FileReference.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('Event', EventSchema);
