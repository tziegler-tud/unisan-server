import mongoose from "mongoose";

import humanFileSize from "../helpers/humanFileSize.js";
import {QuillDeltaToHtmlConverter} from "quill-delta-to-html";
import {wrapTime, extractTimeRangeString, extractDateString} from "./utils.js";

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: {title: string, value: string}, description: {shortDesc: string, longDesc: string}, date: {startDate: Date, endDate: Date}, participants: User[], createdDate: Date}} EventScheme */

const Schema = mongoose.Schema;


// create instance of Schema
var EventBlueprintSchema = new Schema({
    title: {
        value: {
            type: String,
            required: true,
        },
        delta: {
            type: Object,
        },
        html: {
            type: String,
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
            html: {
                type: String,
            }
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
            html: {
                type: String,
            }
        },
    },
    date: {
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },

    },
    location: {
        value: {
            type: String
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
            title: {
                type: String,
                default: "",
            },
            description: {
                type: String,
            },
            allowHigher: {
                type: Boolean,
                default: true,
            },
            date: {
                startTime: {
                    type: Date,
                    default: function(){
                        return this.parent().date.startDate;
                    }
                },
                endTime: {
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
        }
    ],

    createdDate: {
        type: Date,
        default: Date.now
    },
});

EventBlueprintSchema.virtual('date.timeString').get(function() {
    var startDate = this.date.startDate;
    var endDate = this.date.endDate;
    //check if date is available
    if(startDate === undefined || endDate === undefined){
        return "";
    }
    return extractTimeRangeString(this.date.startDate, this.date.endDate);
});


EventBlueprintSchema.virtual('dateRangeString').get(function() {

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

EventBlueprintSchema.virtual('type.index').get(function() {
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

EventBlueprintSchema.pre('save', function(next) {
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

    this.title.html = convertDelta(this.title.delta, this.title.value);
    this.description.shortDesc.html = convertDelta(this.description.shortDesc.delta);
    this.description.longDesc.html = convertDelta(this.description.longDesc.delta);

    function convertDelta(delta,value) {
        if (delta === undefined || delta.ops === undefined) {
            return value ?? "";
        }
        var converter = new QuillDeltaToHtmlConverter(delta.ops, {});
        return converter.convert();
    }
    next();
});

EventBlueprintSchema.post('save', function(error, doc, next) {
    throw new Error(error);
});

EventBlueprintSchema.set('toJSON', { virtuals: true, getters: true });

export default mongoose.model('EventBlueprint', EventBlueprintSchema);
