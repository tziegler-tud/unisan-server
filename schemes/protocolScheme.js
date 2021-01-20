const mongoose = require('mongoose');

const { convertDeltaToHtml } = require('node-quill-converter');

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: {title: string, value: string}, description: {shortDesc: string, longDesc: string}, date: {startDate: Date, endDate: Date}, participants: User[], createdDate: Date}} ProtocolScheme */

const Schema = mongoose.Schema;

// create instance of Schema
var ProtocolSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId, ref: 'User'
    },
    completion: {
        type: Number,
        default: 0,
    },
    content: {

    },
    createdDate: {
        type: Date,
        default: Date.now
    },
});

ProtocolSchema.virtual('dateTimeString').get(function() {

    var date = this.createdDate;
    var dateString;

    function wrapTime(timeString){
        if(parseInt(timeString) < 10){
            return "0" + timeString;
        }
        else return timeString
    }

    //event ends the same day it started. Make output dd.mm.yyyy hh:mm - hh:mm
    dateString = wrapTime(date.getDate()) + "." + wrapTime(date.getMonth()+1) + "." + date.getFullYear() + " " + wrapTime(date.getHours()) + ":" + wrapTime(date.getMinutes());

    return dateString;
});

ProtocolSchema.post('save', function(error, doc, next) {
    throw new Error(error);
});

ProtocolSchema.set('toJSON', { virtuals: true, getters: true });

module.exports = mongoose.model('Protocol', ProtocolSchema);
