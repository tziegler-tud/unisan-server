const mongoose = require('mongoose');
const autoIncrement = require('mongoose-plugin-autoinc-fix');

const Schema = mongoose.Schema;

// create instance of Schema
var LogSchema = new Schema({
    logId: {
        type: Number,
    },
    action: {
        objectType: {
          type: String,
          // [user, event, qualification, userGroup, dataset]
          required: true,
        },
        actionType: {
          type: String,
          //[create, delete, modify]
          required: true,
        },
        actionDetail: {
          type: String,
          /* [userCreate, userDelete, userModify, userImageModify, userAddQualification, userDeleteQualification, userModifyQualification,
                eventCreate, eventDelete, eventModify, eventAddParticipant, eventRemoveParticipant, eventChangeParticipantRole, eventAddFile ]
           */
        },
        key: {

        },
        fullKey: {

        },
        originalValue: {

        },
        value: {

        },
        tag: {}
    },
    authorizedUser: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    target: {
        targetType: {
            type: String,
            // [user, event, qualification, userGroup, dataset]
            required: true,
            default: "user"
        },
        targetObject: {
            type: Schema.Types.ObjectId,
            refPath: "target.targetModel",
            // ref: "User",
            required: true,
        },
        targetObjectId: {
            type: String,
            required: true,
        },
        targetModel: {
            type: String,
            required: true,
            enum: ['User', 'Event'],
        },
        targetState: {
            type: String,
            enum: ['ACTIVE', 'DELETED']
        }
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    httpRequest: {
        method: {
            type: String,
            // ["GET","POST","DELETE","PUT"]
        },
        url: {
            type: String,
        }
    },
    logType: {
        type: String,
        // ["activity", "modification", "server", "other"]
    },
});

LogSchema.virtual('description').get(function() {

    let fullDescription = {en: "", de: ""},
        shortDescription = {en: "", de: ""},
        actionDescription = {en: "", de: ""};

    let minDescription = "", logType = "";

    //try if authorizedUser was populated
    let authorizedUser = (this.authorizedUser.username) ? this.authorizedUser.username : this.authorizedUser;




    // //case-specific describtions
    if(this.target.targetModel === "User"){

        //validate
        let deleted = false;
        if (this.target.targetObject === undefined || this.target.targetObject === null) {
            let str = "<DELETED>";
            deleted = true;
            this.target.targetObject = {id: str + this.target.targetObjectId, username: str +this.target.targetObjectId};
        }
        let target = this.populated("target.targetObject") || deleted  ? this.target.targetObject.username : this.target.targetObject;
        let optionalApostrophe = "";
        if (typeof(target.username) === "string"){
            if(target.username.slice(-1) === "s"){
                optionalApostrophe = "'";
            }
        }

        switch(this.action.actionDetail) {
            case "userCreate":
                fullDescription.en = "user " + authorizedUser + " created new user: " + target;
                fullDescription.de = "Nutzer " + authorizedUser + " hat einen neuen Nutzer erstellt: " + target;

                shortDescription.en = authorizedUser + " created user: " + target;
                shortDescription.de = authorizedUser + " hat " + target + " angelegt";

                actionDescription.en = "created user: " + target;
                actionDescription.de = authorizedUser + "angelegt";

                minDescription = target;
                logType = "Nutzer angelegt";
                break;
            case "userDelete":
                let username = this.action.originalValue;
                fullDescription.en = "user " + authorizedUser + " deleted user: " + target;
                fullDescription.de = "Nutzer " + authorizedUser + " hat Nutzer entfernt: " + target;

                shortDescription.en = authorizedUser + " deleted user: " + target;
                shortDescription.de = authorizedUser + " hat " + target + " entfernt";

                actionDescription.en = "delted user: " + target;
                actionDescription.de = authorizedUser + "entfernt";

                minDescription = username;
                logType = "Nutzer entfernt";
                break;
            case "userModify":

                let tagText = "";
                switch(this.action.tag){
                    case "<DELETED>":
                        tagText = this.action.tag + " ";
                        this.action.value = this.action.originalValue;
                        break;
                    case "<OVERWRITE>":
                        tagText = this.action.tag + " ";
                        break;
                    case "<UPDATE>":
                    default:


                }
                fullDescription.en = "user " + authorizedUser + " changed " + this.action.key + " of user : " + target + " from " + this.action.originalValue + " to " + this.action.value;
                fullDescription.de = "Nutzer " + authorizedUser + " hat " + this.action.key + " von Nutzer: " + target + " von " + this.action.originalValue + " auf " + this.action.value +" geändert";

                shortDescription.en = authorizedUser + " changed " + this.action.key + " of " + target + " to " + this.action.value;
                shortDescription.de = authorizedUser + " änderte " + target + optionalApostrophe + "s " + this.action.key + " auf " + this.action.value;

                actionDescription.en = "changed " + this.action.key + " from " + this.action.originalValue + " to " + this.action.value;
                actionDescription.de = this.action.key + " von " + this.action.originalValue + " zu " + this.action.value + " geändert";

                minDescription = tagText + this.action.key + ": " + this.action.value;
                logType = "Nutzerdaten geändert";
                break;

            case "userImageModify":
                fullDescription.en = "user " + authorizedUser + " changed profile picture of user : " + target;
                fullDescription.de = "Nutzer " + authorizedUser + " hat das Profilbild von Nutzer: " + target + " geändert";

                shortDescription.en = authorizedUser + " changed picture of " + target;
                shortDescription.de = authorizedUser + " hat " + target + optionalApostrophe + "s Profilbild geändert";

                actionDescription.en = "profile picture changed";
                actionDescription.de = "Profilbild geändert";

                minDescription = "";
                logType = "Profilbild geändert";
                break;

            case "userGroupAdd":
                fullDescription.en = "user " + authorizedUser + " added user : " + target +" to group " + this.action.value;
                fullDescription.de = "Nutzer " + authorizedUser + " hat " + target + " zur Gruppe " + this.action.value + " hinzugefügt";

                shortDescription.en = authorizedUser + " added " + target + " to " + this.action.value;
                shortDescription.de = authorizedUser + " hat " + target + " zu " + this.action.value + " hinzugefügt";

                actionDescription.en = "added user to group " + this.action.value;
                actionDescription.de = "Zur Gruppe " + this.action.value + "hinzugefügt";

                minDescription = this.action.value;
                logType = "Zu Gruppe hinzugefügt";
                break;

            case "userGroupDelete":
                fullDescription.en = "user " + authorizedUser + " removed user : " + target +" to group " + this.action.value;
                fullDescription.de = "Nutzer " + authorizedUser + " hat " + target + " von Gruppe " + this.action.value + " entfernt";

                shortDescription.en = authorizedUser + " removed " + target + " from " + this.action.value;
                shortDescription.de = authorizedUser + " hat " + target + " von " + this.action.value + " entfernt";

                actionDescription.en = "removed user from group " + this.action.value;
                actionDescription.de = "Von Gruppe " + this.action.value + "entfernt";

                minDescription = this.action.value;
                logType = "Von Gruppe entfernt";
                break;

            case "userRoleModify":
                fullDescription.en = "user " + authorizedUser + " changed role of user : " + target +" to " + this.action.value;
                fullDescription.de = "Nutzer " + authorizedUser + " hat die Rolle von " + target + " auf " + this.action.value + " geändert";

                shortDescription.en = authorizedUser + " changed role of " + target + " to " + this.action.value;
                shortDescription.de = authorizedUser + " hat " + target + "'s Rolle auf " + this.action.value + " geändert";

                actionDescription.en = "changed role to " + this.action.value;
                actionDescription.de = "Rolle geändert auf: " + this.action.value;

                minDescription = this.action.value;
                logType = "Rolle geändert";
                break;
        }
    }

    if (this.target.targetModel === "Event"){
        //validate
        let deleted = false;
        if (this.target.targetObject === undefined || this.target.targetObject === null) {
            let str = "<DELETED>";
            deleted = true;
            this.target.targetObject = {id: str + this.target.targetObjectId, title: {value: str +this.target.targetObjectId}};
        }
        let target = this.populated("target.targetObject")|| deleted ? this.target.targetObject.title.value : this.target.targetObject;
        let targetUser;
        switch(this.action.actionDetail) {
            case "eventCreate":
                fullDescription.en = "user " + authorizedUser + " created new event: " + target;
                fullDescription.de = "Nutzer " + authorizedUser + " hat ein neues Event erstellt: " + target;

                shortDescription.en = authorizedUser + " created Event: " + target;
                shortDescription.de = authorizedUser + " hat Event '" + target + "' angelegt";

                actionDescription.en = "created event: " + target;
                actionDescription.de = authorizedUser + "angelegt";

                minDescription = this.action.value;
                logType = "Event angelegt";
                break;
            case "eventDelete":
                fullDescription.en = "user " + authorizedUser + " removed event: " + target;
                fullDescription.de = "Nutzer " + authorizedUser + " hat ein Event entfernt: " + target;

                shortDescription.en = authorizedUser + " removed event: " + target;
                shortDescription.de = authorizedUser + " hat Event '" + target + "' entfernt";

                actionDescription.en = "removed event: " + target;
                actionDescription.de = authorizedUser + "entfernt";

                minDescription = this.action.value;
                logType = "Event entfernt";
                break;
            case "eventModify":
                fullDescription.en = "user " + authorizedUser + " changed event '" + target + "'";
                fullDescription.de = "Nutzer " + authorizedUser + " hat Event '" + target + "' geändert.";

                shortDescription.en = authorizedUser + " changed '" + target + "'";
                shortDescription.de = authorizedUser + " hat '" + target + "' geändert";

                actionDescription.en = "changed event: " + target;
                actionDescription.de = authorizedUser + "geändert";

                minDescription = target;
                logType = "Event geändert";
                break;
            case "eventAddParticipant":

                targetUser = this.action.key;

                fullDescription.en = targetUser + " registered for event " + target;
                fullDescription.de = targetUser + " nimmt am Event: " + target +" teil.";
                shortDescription.en = targetUser + " registered for event " + target;
                shortDescription.de = targetUser + " nimmt an " + target + " teil";

                actionDescription.en = targetUser + "registered for " + target;
                actionDescription.de = targetUser + "nimmt an " + target + " teil";

                minDescription = targetUser;
                logType = "Teilnahme an Event";
                break;
            case "eventRemoveParticipant":
                targetUser = this.action.key;
                fullDescription.en = targetUser + " unregistered for event " + target;
                fullDescription.de = targetUser + " nimmt nicht mehr am Event: " + target +" teil.";
                shortDescription.en = targetUser + " unregistered for event " + target;
                shortDescription.de = targetUser + " nimmt nicht an " + target + " teil";

                actionDescription.en = targetUser + "unregistered for " + target;
                actionDescription.de = targetUser + "nimmt nicht an " + target + " teil";

                minDescription = targetUser;
                logType = "Abmeldung von Event";
                break;
            case "eventChangeParticipantRole":
                targetUser = this.action.key;
                let role = this.action.value;
                fullDescription.en = "user " + authorizedUser + " changed role of " + targetUser + " to " + role + " for event: " + target ;
                fullDescription.de = "Nutzer " + authorizedUser + " hat Rolle von " + targetUser + " auf " + role + " für Event: " + target + " geändert";

                shortDescription.en = target + ": role of " + targetUser + " changed to " + role;
                shortDescription.de = target + ": " + targetUser + " ist jetzt " + role;

                actionDescription.en = "changed role of: " + targetUser + " to " + role;
                actionDescription.de = "Rolle von " + targetUser + " auf " + role + " geändert";

                minDescription = target + ": " + targetUser + "-" + role;
                logType = "Rolle geändert";
                break;
            case "eventAddFile":
                if (!this.action.value) this.action.value = "_filename_not_found";
                fullDescription.en = "user " + authorizedUser + " added file " + this.action.value + " to event '" + target + "'";
                fullDescription.de = "Nutzer " + authorizedUser + " hat Datei " + this.action.value + " zu Event '" + target + "' hinzugefügt.";

                shortDescription.en = authorizedUser + " added file to '" + target + "'";
                shortDescription.de = authorizedUser + " hat eine Datei zu '" + target + "' hinzufügt";

                actionDescription.en = "added file: " + target;
                actionDescription.de = "Datei hinzugefügt: " + target;

                minDescription = target;
                logType = "Event: Datei hinzugefügt";
                break;

            case "eventRemoveFile":
                if (!this.action.value) this.action.value = "_filename_not_found";
                fullDescription.en = "user " + authorizedUser + " removed file " + this.action.value + "from event '" + target + "'";
                fullDescription.de = "Nutzer " + authorizedUser + " hat Datei " + this.action.value + " von Event '" + target + "' entfernt.";

                shortDescription.en = authorizedUser + " removed file from '" + target + "'";
                shortDescription.de = authorizedUser + " hat eine Datei von'" + target + "' entfernt";

                actionDescription.en = "removed file: " + target;
                actionDescription.de = "Datei entfernt: " + target;

                minDescription = target;
                logType = "Event: Datei entfernt";
                break;
        }
    }


    let description = {
        fullDescription: fullDescription,
        shortDescription: shortDescription,
        actionDescription: actionDescription,
        min: minDescription,
        logType: logType,
    }

    return description;
});

LogSchema.virtual('target.title').get(function() {
    let oj = this.target.targetObject;
    //validate          Comment: if object was deleted, this is null
    if (oj === null || oj === undefined) {
        return "<DELETED>";
    }
    else {
        //check if populated
        if(!(this.populated("target.targetObject") || oj.username || oj.title)) {
            return oj;
        }
        else {
            switch(this.target.targetModel) {
                case "User":
                    return oj.username;
                case "Event":
                    return oj.title.value;
            }
        }
    }
});

LogSchema.post('find', async function(docs) {
    for (let doc of docs) {
        switch(doc.target.targetModel){
            case "User":
                await doc.populate({
                    path: "target.targetObject",
                    select: "username"
                });
                break;
            case "Event":
                await doc.populate({
                    path: "target.targetObject",
                    model: "Event",
                    select: "title",
                });
                break;
            default:
                break;
        }
    }
});

LogSchema.post('save', function(error, doc, next) {
    throw new Error(error);
});

LogSchema.plugin(autoIncrement.plugin, { model: 'Log', field: 'logId', startAt: 1, incrementBy: 1});

LogSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Log', LogSchema);



/**
 * this resets the counter from  plugin. just run once at server startup or move to own function
 */
// let Log = mongoose.model('Log', LogSchema);
// let log = new Log();
//log.save(err => {
//
//     // log._id === 100 -> true
//
//     log.nextCount().then(count => {
//
//         // count === 101 -> true
//
//         log.resetCount().then(nextCount => {
//
//             // nextCount === 100 -> true
//
//         });
//
//     });
//
// });
// module.exports = user;
