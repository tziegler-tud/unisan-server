import mongoose from "mongoose";
import autoIncrement from "mongoose-plugin-autoinc-fix";

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
            enum: ['User', 'Event',  "UserGroup"],
        },
        targetState: {
            type: String,
            enum: ['ACTIVE', 'DELETED']
        },
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

    let fullDescription = {template: {de: "", en: ""},  en: "", de: ""},
        shortDescription = {template: {de: "", en: ""}, en: "", de: ""},
        actionDescription = {en: "", de: ""};

    let variables = {

    }

    let minDescription = "", logType = "";


    let authorizedUser = "UNKNOWN_USER"
    let authorizedUserId = "UNKNOWN_USER_ID"
    //try if authorizedUser was populated
    if(this.authorizedUser){
        authorizedUser = (this.authorizedUser.username) ? this.authorizedUser.username : this.authorizedUser;
        authorizedUserId = (this.authorizedUser.id) ? this.authorizedUser.id : this.authorizedUser;
    }


    variables.authorizedUser = {
        type: variableTypes.USER,
        value: authorizedUser,
        ref: authorizedUserId,
    };




    // //case-specific describtions
    if(this.target.targetModel === "User"){

        //validate
        let deleted = false;
        if (this.target.targetObject === undefined || this.target.targetObject === null || this.target.targetState === "DELETED") {
            let str = "<DELETED>";
            deleted = true;
            this.target.targetObject = {id: str + this.target.targetObjectId, username: this.action.originalValue ? this.action.originalValue : str +this.target.targetObjectId};
        }
        let target = this.populated("target.targetObject") || deleted  ? this.target.targetObject.username : this.target.targetObject;
        let optionalApostrophe = "s";
        if (typeof(target.username) === "string"){
            if(target.username.slice(-1) === "s"){
                optionalApostrophe = "'s";
            }
        }


        variables.target = {
            type: variableTypes.USER,
            value: target,
            ref: this.target.targetObjectId
        }

        switch(this.action.actionDetail) {
            case "userCreate":

                fullDescription.template.de = "$authorizedUser hat einen neuen User erstellt: $target";
                fullDescription.template.en = "$authorizedUser created new user: $target";
                fullDescription.en = authorizedUser + " created new user: " + target;
                fullDescription.de = authorizedUser + " hat einen neuen User erstellt: " + target;

                shortDescription.template.de = "$authorizedUser hat $target angelegt";
                shortDescription.en = authorizedUser + " created user: " + target;
                shortDescription.de = authorizedUser + " hat " + target + " angelegt";

                actionDescription.en = "created user: " + target;
                actionDescription.de = authorizedUser + " angelegt";

                minDescription = target;
                logType = "User angelegt";
                break;
            case "userDelete":
                variables.target.ref = undefined;

                fullDescription.template.de = "$authorizedUser hat User entfernt: $target";
                fullDescription.en = authorizedUser + " deleted user: " + target;
                fullDescription.de = authorizedUser + " hat User entfernt: " + target;

                shortDescription.template.de = "$authorizedUser hat $target entfernt";
                shortDescription.en = authorizedUser + " deleted user: " + target;
                shortDescription.de = authorizedUser + " hat " + target + " entfernt";

                actionDescription.en = "delted user: " + target;
                actionDescription.de = authorizedUser + "entfernt";

                minDescription = target;
                logType = "User entfernt";
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
                variables = Object.assign(variables,{
                    attribute: {
                        type: variableTypes.ATTRIBUTE,
                        value: this.action.key,
                    },
                    value1: {
                        type: variableTypes.VALUE,
                        value: this.action.originalValue,
                    },
                    value2: {
                        type: variableTypes.VALUE,
                        value: this.action.value,
                    },
                    optionalApostrophe: {
                        type: variableTypes.TEXT,
                        value: optionalApostrophe
                    },
                });

                fullDescription.template.de = "$authorizedUser hat $attribute von Nutzer: $target von $value1 auf $value2 geändert";
                fullDescription.en = authorizedUser + " changed " + this.action.key + " of user : " + target + " from " + this.action.originalValue + " to " + this.action.value;
                fullDescription.de = authorizedUser + " hat " + this.action.key + " von Nutzer: " + target + " von " + this.action.originalValue + " auf " + this.action.value +" geändert";

                shortDescription.template.de = "$authorizedUser änderte $target $optionalApostrophe $attribute auf $value2";
                shortDescription.en = authorizedUser + " changed " + this.action.key + " of " + target + " to " + this.action.value;
                shortDescription.de = authorizedUser + " änderte " + target + optionalApostrophe + this.action.key + " auf " + this.action.value;

                actionDescription.en = "changed " + this.action.key + " from " + this.action.originalValue + " to " + this.action.value;
                actionDescription.de = this.action.key + " von " + this.action.originalValue + " zu " + this.action.value + " geändert";

                minDescription = tagText + this.action.key + ": " + this.action.value;
                logType = "Nutzerdaten geändert";
                break;

            case "userImageModify":
                variables = Object.assign(variables,{
                    optionalApostrophe: {
                        type: variableTypes.TEXT,
                        value: optionalApostrophe
                    },
                });

                fullDescription.template.de = "$authorizedUser hat das Profilbild von Nutzer: $target geändert";
                fullDescription.en = authorizedUser + " changed profile picture of user : " + target;
                fullDescription.de = authorizedUser + " hat das Profilbild von Nutzer: " + target + " geändert";

                shortDescription.template.de = "$authorizedUser hat $target $optionalApostrophe Profilbild geändert";
                shortDescription.en = authorizedUser + " changed picture of " + target;
                shortDescription.de = authorizedUser + " hat " + target + optionalApostrophe + " Profilbild geändert";

                actionDescription.en = "profile picture changed";
                actionDescription.de = "Profilbild geändert";

                minDescription = "";
                logType = "Profilbild geändert";
                break;

            case "userAddQualification":
                variables = Object.assign(variables,{
                    qualification: {
                        type: variableTypes.QUALIFICATION,
                        value: this.action.value,
                    },
                });
                fullDescription.template.de = "$authorizedUser hat Qualifikation $qualification zu $target hinzugefügt";
                fullDescription.en = authorizedUser + " added qualification : "  + this.action.value + " to user "+ target;
                fullDescription.de = authorizedUser + " hat Qualifikation " + this.action.value + " zu " + target + " hinzugefügt";

                shortDescription.template.de = "$authorizedUser hat $qualification zu $target hinzugefügt";
                shortDescription.en = authorizedUser + " added " + this.action.value + " to " + target;
                shortDescription.de = authorizedUser + " hat " + this.action.value + " zu " + target + " hinzugefügt";

                actionDescription.en = "added qualification: " + this.action.value;
                actionDescription.de = "Qualifikation " + this.action.value + "hinzugefügt";

                minDescription = this.action.value;
                logType = "Qualifikation hinzugefügt";
                break;

            case "userUpdateQualification":
                variables = Object.assign(variables,{
                    qualification: {
                        type: variableTypes.QUALIFICATION,
                        value: this.action.value,
                    },
                });

                fullDescription.template.de = "$authorizedUser hat Qualifikation $qualification von User $target geändert.";
                fullDescription.en = authorizedUser + " changed qualification : "  + this.action.value + " of user "+ target +".";
                fullDescription.de = authorizedUser + " hat Qualifikation " + this.action.value + " von User " + target + " geändert.";

                shortDescription.template.de = "$authorizedUser hat $qualification von $target geändert";
                shortDescription.en = authorizedUser + " changed " + this.action.value + " of " + target;
                shortDescription.de = authorizedUser + " hat " + this.action.value + " von " + target + " geändert";

                actionDescription.en = "changed qualification: " + this.action.value;
                actionDescription.de = "Qualifikation " + this.action.value + " geändert";

                minDescription = this.action.value;
                logType = "Qualifikation geändert";
                break;

            case "userRemoveQualification":
                variables = Object.assign(variables,{
                    qualification: {
                        type: variableTypes.QUALIFICATION,
                        value: this.action.value,
                    },
                });

                fullDescription.template.de = "$authorizedUser hat Qualifikation $qualification von $target entfernt";
                fullDescription.en = authorizedUser + " removed qualification : "  + this.action.value + " of user "+ target;
                fullDescription.de = authorizedUser + " hat Qualifikation " + this.action.value + " von " + target + " entfernt";

                shortDescription.template.de = "$authorizedUser hat $qualification von $target entfernt";
                shortDescription.en = authorizedUser + " removed " + this.action.value + " of " + target;
                shortDescription.de = authorizedUser + " hat " + this.action.value + " von " + target + " entfernt";

                actionDescription.en = "removed qualification: " + this.action.value;
                actionDescription.de = "Qualifikation " + this.action.value + " entfernt";

                minDescription = this.action.value;
                logType = "Qualifikation entfernt";
                break;

            case "userGroupAdd":
                variables = Object.assign(variables,{
                    group: {
                        type: variableTypes.GROUP,
                        value: this.action.value,
                    },
                });
                fullDescription.template.de = "$authorizedUser hat $target zur Gruppe $group hinzugefügt";
                fullDescription.en = authorizedUser + " added user : " + target +" to group " + this.action.value;
                fullDescription.de = authorizedUser + " hat " + target + " zur Gruppe " + this.action.value + " hinzugefügt";

                shortDescription.template.de = "$authorizedUser hat $target zu $group hinzugefügt";
                shortDescription.en = authorizedUser + " added " + target + " to " + this.action.value;
                shortDescription.de = authorizedUser + " hat " + target + " zu " + this.action.value + " hinzugefügt";

                actionDescription.en = "added user to group " + this.action.value;
                actionDescription.de = "Zur Gruppe " + this.action.value + "hinzugefügt";

                minDescription = this.action.value;
                logType = "Zu Gruppe hinzugefügt";
                break;

            case "userGroupDelete":
                variables = Object.assign(variables,{
                    group: {
                        type: variableTypes.GROUP,
                        value: this.action.value,
                    },
                });
                fullDescription.template.de = "$authorizedUser hat $target von Gruppe $group entfernt";
                fullDescription.en = authorizedUser + " removed user : " + target +" from group " + this.action.value;
                fullDescription.de = authorizedUser + " hat " + target + " von Gruppe " + this.action.value + " entfernt";

                shortDescription.template.de = "$authorizedUser hat $target von $group entfernt";
                shortDescription.en = authorizedUser + " removed " + target + " from " + this.action.value;
                shortDescription.de = authorizedUser + " hat " + target + " von " + this.action.value + " entfernt";

                actionDescription.en = "removed user from group " + this.action.value;
                actionDescription.de = "Von Gruppe " + this.action.value + "entfernt";

                minDescription = this.action.value;
                logType = "Von Gruppe entfernt";
                break;

            case "userRoleModify":
                variables = Object.assign(variables,{
                    role: {
                        type: variableTypes.GROUP,
                        value: this.action.value,
                    },
                    optionalApostrophe: {
                        type: variableTypes.TEXT,
                        value: optionalApostrophe
                    },
                });
                fullDescription.template.de = "$authorizedUser hat die Rolle von $target auf $role geändert";
                fullDescription.en = authorizedUser + " changed role of user : " + target +" to " + this.action.value;
                fullDescription.de = authorizedUser + " hat die Rolle von " + target + " auf " + this.action.value + " geändert";

                shortDescription.template.de = "$authorizedUser hat $target $optionalApostrophe Rolle auf $role geändert";
                shortDescription.en = authorizedUser + " changed role of " + target + " to " + this.action.value;
                shortDescription.de = authorizedUser + " hat " + target + optionalApostrophe + " Rolle auf " + this.action.value + " geändert";

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
        if (this.target.targetObject === undefined || this.target.targetObject === null || this.target.targetState === "DELETED") {
            let str = "<DELETED>";
            deleted = true;
            this.target.targetObject = {id: str + this.target.targetObjectId, title: {value: this.action.value ? this.action.value : str +this.target.targetObjectId}};
        }
        let target = this.populated("target.targetObject")|| deleted ? this.target.targetObject.title.value : this.target.targetObject;
        let targetUser;

        variables.target = {
            type: variableTypes.EVENT,
            value: target,
            ref: this.target.targetObjectId
        }


        switch(this.action.actionDetail) {
            case "eventCreate":

                fullDescription.template.de = "$authorizedUser hat ein neues Event erstellt: $target";
                fullDescription.en = authorizedUser + " created new event: " + target;
                fullDescription.de = authorizedUser + " hat ein neues Event erstellt: " + target;

                shortDescription.template.de = "$authorizedUser hat Event $target angelegt";
                shortDescription.en = authorizedUser + " created Event: " + target;
                shortDescription.de = authorizedUser + " hat Event '" + target + "' angelegt";

                actionDescription.en = "created event: " + target;
                actionDescription.de = authorizedUser + "angelegt";

                minDescription = this.action.value;
                logType = "Event angelegt";
                break;
            case "eventDelete":

                variables.target.ref = undefined;

                fullDescription.template.de = "$authorizedUser hat ein Event entfernt: $target";
                fullDescription.en = authorizedUser + " removed event: " + target;
                fullDescription.de = authorizedUser + " hat ein Event entfernt: " + target;

                shortDescription.template.de = "$authorizedUser hat Event $target entfernt";
                shortDescription.en = authorizedUser + " removed event: " + target;
                shortDescription.de = authorizedUser + " hat Event '" + target + "' entfernt";

                actionDescription.en = "removed event: " + target;
                actionDescription.de = authorizedUser + "entfernt";

                minDescription = this.action.value;
                logType = "Event entfernt";
                break;
            case "eventModify":

                fullDescription.template.de = "$authorizedUser hat Event $target geändert";
                fullDescription.en = authorizedUser + " changed event '" + target + "'";
                fullDescription.de = authorizedUser + " hat Event '" + target + "' geändert";

                shortDescription.template.de = "$authorizedUser hat $target geändert";
                shortDescription.en = authorizedUser + " changed '" + target + "'";
                shortDescription.de = authorizedUser + " hat '" + target + "' geändert";

                actionDescription.en = "changed event: " + target;
                actionDescription.de = authorizedUser + "geändert";

                minDescription = target;
                logType = "Event geändert";
                break;
            case "eventAddParticipant":
                targetUser = this.action.key;

                variables = Object.assign(variables,{
                    targetUser: {
                        type: variableTypes.USER,
                        value: targetUser,
                        ref: targetUser,
                    }
                });

                fullDescription.template.de = "$targetUser nimmt am Event: $target teil";
                fullDescription.en = targetUser + " registered for event " + target;
                fullDescription.de = targetUser + " nimmt am Event: " + target +" teil";

                shortDescription.template.de = "$targetUser nimmt an $target teil";
                shortDescription.en = targetUser + " registered for event " + target;
                shortDescription.de = targetUser + " nimmt an " + target + " teil";

                actionDescription.en = targetUser + "registered for " + target;
                actionDescription.de = targetUser + "nimmt an " + target + " teil";

                minDescription = targetUser;
                logType = "Teilnahme an Event";
                break;
            case "eventRemoveParticipant":
                targetUser = this.action.key;
                variables = Object.assign(variables,{
                    targetUser: {
                        type: variableTypes.USER,
                        value: targetUser,
                        ref: targetUser,
                    }
                });
                fullDescription.template.de = "$targetUser nimmt nicht mehr am Event: $target teil";
                fullDescription.en = targetUser + " unregistered for event " + target;
                fullDescription.de = targetUser + " nimmt nicht mehr am Event: " + target +" teil.";

                shortDescription.template.de = "$targetUser nimmt nicht an $target teil";
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
                variables = Object.assign(variables,{
                    targetUser: {
                        type: variableTypes.USER,
                        value: targetUser,
                        ref: targetUser,
                    },
                    role: {
                        type: variableTypes.GROUP,
                        value: role
                    }
                });
                fullDescription.template.de = "$authorizedUser hat Rolle von $targetUser auf $role für Event: $target geändert";
                fullDescription.en = authorizedUser + " changed role of " + targetUser + " to " + role + " for event: " + target ;
                fullDescription.de = authorizedUser + " hat Rolle von " + targetUser + " auf " + role + " für Event: " + target + " geändert";

                shortDescription.template.de = "$target: $targetUser ist jetzt $role";
                shortDescription.en = target + ": role of " + targetUser + " changed to " + role;
                shortDescription.de = target + ": " + targetUser + " ist jetzt " + role;

                actionDescription.en = "changed role of: " + targetUser + " to " + role;
                actionDescription.de = "Rolle von " + targetUser + " auf " + role + " geändert";

                minDescription = target + ": " + targetUser + "-" + role;
                logType = "Rolle geändert";
                break;
            case "eventAddPost":
                {
                    let qualificationName = this.action.key;
                    variables = Object.assign(variables,{
                        qualificationName: {
                            type: variableTypes.QUALIFICATION,
                            value: qualificationName,
                        }
                    });

                    fullDescription.template.de = "$target: $authorizedUser hat einen Dienstposten hinzugefügt: $qualificationName";
                    fullDescription.en = target + ": " + authorizedUser +" has created an event posting: " + qualificationName;
                    fullDescription.de = target + ": " + authorizedUser + " hat einen Dienstposten hinzugefügt: " + qualificationName;

                    shortDescription.template.de = "$target: Dienstposten hinzugefügt: $qualificationName";
                    shortDescription.en = target + ": posting added: " + qualificationName;
                    shortDescription.de = target + ": Dienstposten hinzugefügt: " + qualificationName;

                    actionDescription.en = "posting added: " + qualificationName;
                    actionDescription.de = "Dienstposten hinzugefügt: " + qualificationName;

                    minDescription = qualificationName;
                    logType = "Dienstposten hinzugefügt";
                    break;
                }
            case "eventRemovePost":
                {
                    let qualificationName = this.action.key;
                    variables = Object.assign(variables,{
                        qualificationName: {
                            type: variableTypes.QUALIFICATION,
                            value: qualificationName,
                        }
                    });

                    fullDescription.template.de = "$target: $authorizedUser hat einen Dienstposten entfernt: $qualificationName";
                    fullDescription.en = target + ": " + authorizedUser +" has removed an event posting: " + qualificationName;
                    fullDescription.de = target + ": " + authorizedUser + " hat einen Dienstposten entfernt: " + qualificationName;

                    shortDescription.template.de = "$target: Dienstposten entfernt: $qualificationName";
                    shortDescription.en = target + ": " + "posting removed: " + qualificationName;
                    shortDescription.de = target + ": " + "Dienstposten entfernt: " + qualificationName;

                    actionDescription.en = "posting removed: " + qualificationName;
                    actionDescription.de = "Dienstposten added: " + qualificationName;

                    minDescription = qualificationName;
                    logType = "Dienstposten entfernt";
                    break;
                }
            case "eventAssignPost":
            {
                let qualificationName = this.action.value;
                let targetUser = this.action.key;
                variables = Object.assign(variables,{
                    targetUser: {
                        type: variableTypes.USER,
                        value: targetUser,
                        ref: targetUser,
                    },
                    qualificationName: {
                        type: variableTypes.QUALIFICATION,
                        value: qualificationName,
                    }
                });

                if (authorizedUser !== targetUser) {
                    fullDescription.template.de = "$target: $authorizedUser hat $targetUser für einen Posten angemeldet: $qualificationName";
                    fullDescription.en = target + ": " + authorizedUser +" has assigned " + targetUser + " to an event posting: " + qualificationName;
                    fullDescription.de = target + ": " + authorizedUser + " hat " + targetUser + " für einen Posten angemeldet: " + qualificationName;

                    shortDescription.template.de = "$target: $authorizedUser hat $targetUser als $qualificationName angemeldet";
                    shortDescription.en = target + ": " + authorizedUser + " assigned " + targetUser + " as " + qualificationName;
                    shortDescription.de = target + ": " + authorizedUser + " hat " + targetUser + "als " + qualificationName + " angemeldet";
                }
                else {
                    fullDescription.template.de = "$target: $targetUser hat sich für einen Posten angemeldet: $qualificationName";
                    fullDescription.en = targetUser + " has signed up for an event posting: " + qualificationName;
                    fullDescription.de = targetUser + " hat sich für einen Posten angemeldet: " + qualificationName;

                    shortDescription.template.de = "$target: $targetUser hat sich als $qualificationName angemeldet";
                    shortDescription.en = targetUser + " signed up for " + qualificationName;
                    shortDescription.de = targetUser + "hat sich als " + qualificationName + " angemeldet";
                }



                actionDescription.en = targetUser + " assigned: " + qualificationName;
                actionDescription.de = targetUser + " angemeldet: " + qualificationName;

                minDescription = qualificationName;
                logType = "Dienstanmeldung";
                break;
            }
            case "eventUnassignPost":
            {
                let qualificationName = this.action.value;
                let targetUser = this.action.key;
                variables = Object.assign(variables,{
                    targetUser: {
                        type: variableTypes.USER,
                        value: targetUser,
                        ref: targetUser,
                    },
                    qualificationName: {
                        type: variableTypes.QUALIFICATION,
                        value: qualificationName,
                    }
                });

                if (authorizedUser !== targetUser) {
                    fullDescription.template.de = "$target: $authorizedUser hat $targetUser von einem Posten abgemeldet: $qualificationName";
                    fullDescription.en = target + ": " + authorizedUser +" has unassigned " + targetUser + " from event posting: " + qualificationName;
                    fullDescription.de = target + ": " + authorizedUser + " hat " + targetUser + " von einem Posten abgemeldet: " + qualificationName;

                    shortDescription.template.de = "$target: $authorizedUser hat $targetUser abgemeldet: $qualificationName";
                    shortDescription.en = target + ": " + authorizedUser + " unassigned " + targetUser + " from " + qualificationName;
                    shortDescription.de = target + ": " + authorizedUser + " hat " + targetUser + "abgemeldet: " + qualificationName;
                }
                else {
                    fullDescription.en = targetUser + " has signed up for an event posting: " + qualificationName;
                    fullDescription.de = targetUser + " hat sich für von Posten abgemeldet: " + qualificationName;
                    shortDescription.en = targetUser + " signed up for " + qualificationName;
                    shortDescription.de = targetUser + "hat sich abgemeldet: " + qualificationName;
                }



                actionDescription.en = targetUser + " unassigned: " + qualificationName;
                actionDescription.de = targetUser + " abgemeldet: " + qualificationName;

                minDescription = qualificationName;
                logType = "Dienstabmeldung";
                break;
            }

            case "eventAddFile":
                if (!this.action.value) this.action.value = "_filename_not_found";
                variables = Object.assign(variables,{
                    filename: {
                        type: variableTypes.QUALIFICATION,
                        value: this.action.value,
                    }
                });
                fullDescription.template.de = "$authorizedUser hat Datei $filename zu $target hinzugefügt";
                fullDescription.en = authorizedUser + " added file " + this.action.value + " to event '" + target + "'";
                fullDescription.de = authorizedUser + " hat Datei " + this.action.value + " zu Event '" + target + "' hinzugefügt.";

                shortDescription.template.de = "$authorizedUser hat eine Datei zu $target hinzufügt";
                shortDescription.en = authorizedUser + " added file to '" + target + "'";
                shortDescription.de = authorizedUser + " hat eine Datei zu '" + target + "' hinzufügt";

                actionDescription.en = "added file: " + target;
                actionDescription.de = "Datei hinzugefügt: " + target;

                minDescription = target;
                logType = "Event: Datei hinzugefügt";
                break;

            case "eventRemoveFile":
                if (!this.action.value) this.action.value = "_filename_not_found";
                variables = Object.assign(variables,{
                    filename: {
                        type: variableTypes.QUALIFICATION,
                        value: this.action.value,
                    }
                });
                fullDescription.template.de = "$authorizedUser hat Datei $filename von $target entfernt.";
                fullDescription.en = authorizedUser + " removed file " + this.action.value + "from event '" + target + "'";
                fullDescription.de = authorizedUser + " hat Datei " + this.action.value + " von Event '" + target + "' entfernt.";

                shortDescription.template.de = "$authorizedUser hat eine Datei von $target entfernt";
                shortDescription.en = authorizedUser + " removed file from '" + target + "'";
                shortDescription.de = authorizedUser + " hat eine Datei von '" + target + "' entfernt";

                actionDescription.en = "removed file: " + target;
                actionDescription.de = "Datei entfernt: " + target;

                minDescription = target;
                logType = "Event: Datei entfernt";
                break;
        }
    }

    if (this.target.targetModel === "UserGroup") {
        //validate
        let deleted = false;
        if (this.target.targetObject === undefined || this.target.targetObject === null || this.target.targetState === "DELETED") {
            let str = "<DELETED>";
            deleted = true;
            this.target.targetObject = {
                id: str + this.target.targetObjectId,
                title: str + this.target.targetObjectId
            };
        }
        let target = this.populated("target.targetObject") ? this.target.targetObject.title : this.action.key;
        let targetGroup;
        let permission = this.action.value;

        variables.target = {
            type: variableTypes.GROUP,
            value: target,
            ref: this.target.targetObjectId
        }

        switch (this.action.actionDetail) {
            case "groupAdd":

                fullDescription.template.de = "$authorizedUser hat eine neue Gruppe erstellt: $target";
                fullDescription.en = authorizedUser + " created new userGroup: " + target;
                fullDescription.de = authorizedUser + " hat eine neue Gruppe erstellt: " + target;

                shortDescription.template.de = "$authorizedUser hat Gruppe $target erstellt";
                shortDescription.en = authorizedUser + " created userGroup: " + target;
                shortDescription.de = authorizedUser + " hat Gruppe '" + target + "' erstellt";

                actionDescription.en = "created userGroup: " + target;
                actionDescription.de = target + "erstellt";

                minDescription = this.action.value;
                logType = "Gruppe erstellt";
                break;
            case "groupRemove":

                fullDescription.template.de = "$authorizedUser hat eine Gruppe entfernt: $target";
                fullDescription.en = authorizedUser + " removed userGroup: " + target;
                fullDescription.de = authorizedUser + " hat eine Gruppe entfernt: " + target;

                shortDescription.template.de = "$authorizedUser hat Gruppe $target entfernt";
                shortDescription.en = authorizedUser + " removed userGroup: " + target;
                shortDescription.de = authorizedUser + " hat Gruppe '" + target + "' entfernt";

                actionDescription.en = "removed userGroup: " + target;
                actionDescription.de = target + "entfernt";

                minDescription = this.action.value;
                logType = "Gruppe entfernt";
                break;
            case "groupModify":

                fullDescription.template.de = "$authorizedUser hat eine Gruppe geändert: $target";
                fullDescription.en = authorizedUser + " changed userGroup: " + target;
                fullDescription.de = authorizedUser + " hat eine Gruppe geändert: " + target;

                shortDescription.de = "$authorizedUser hat Gruppe $target geändert";
                shortDescription.en = authorizedUser + " changed userGroup: " + target;
                shortDescription.de = authorizedUser + " hat Gruppe '" + target + "' geändert";

                actionDescription.en = "changed userGroup: " + target;
                actionDescription.de = target + "geändert";

                minDescription = this.action.value;
                logType = "Gruppe geändert";
                break;
            case "groupAddPermission":
                variables = Object.assign(variables,{
                    permission: {
                        type: variableTypes.GROUP,
                        value: permission,
                    }
                });
                fullDescription.template.de = "$authorizedUser hat eine Berechtigung zu Gruppe $target hinzugefügt: $permission";
                fullDescription.en = authorizedUser + " added permission: " + permission + "to userGroup: " + target;
                fullDescription.de = authorizedUser + " hat eine Berechtigung zu Gruppe " + target + " hinzugefügt: " + permission;

                shortDescription.template.de = authorizedUser + " hat Berechtigung'" + permission + "' zu " + target + "hinzugefügt";
                shortDescription.en = authorizedUser + " added permission: " + permission + " to " + target;
                shortDescription.de = authorizedUser + " hat Berechtigung'" + permission + "' zu " + target + "hinzugefügt";

                actionDescription.en = target + ":added permission: " + permission;
                actionDescription.de = target + " Berechtigung hinzugefügt: " + permission;

                minDescription = this.action.value;
                logType = "Berechtigung hinzugefügt";
                break;
            case "groupRemovePermission":
                variables = Object.assign(variables,{
                    permission: {
                        type: variableTypes.GROUP,
                        value: permission,
                    }
                });
                fullDescription.template.de = "$authorizedUser hat Berechtigung von Gruppe $target entfernt: $permission";
                fullDescription.en = authorizedUser + " removed permission: " + permission + "to userGroup: " + target;
                fullDescription.de = authorizedUser + " hat Berechtigung von Gruppe " + target + " entfernt: " + permission;

                shortDescription.template.de = "$authorizedUser hat Berechtigung $permission von $target entfernt";
                shortDescription.en = authorizedUser + " removed permission: " + permission + " to " + target;
                shortDescription.de = authorizedUser + " hat Berechtigung'" + permission + "' von " + target + "entfernt";

                actionDescription.en = target + ":removed permission: " + permission;
                actionDescription.de = target + " Berechtigung entfernt: " + permission;

                minDescription = this.action.value;
                logType = "Berechtigung entfernt";
                break;
        }
    }

    let description = {
        fullDescription: fullDescription,
        shortDescription: shortDescription,
        actionDescription: actionDescription,
        min: minDescription,
        variables: variables,
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
                case "UserGroup":
                    return oj.title;
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
            case "UserGroup":
                await doc.populate({
                    path: "target.targetObject",
                    model: "UserGroup",
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

export default mongoose.model('Log', LogSchema);



/**
 * this resets the counter from  plugin. just run once at server startup or move to own function
 */
// let Log = mongoose.model('Log', LogSchema);
// let log = new Log();
// log.save(err => {
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

const variableTypes = {
    USER: "USER",
    EVENT: "EVENT",
    QUALIFICATION: "QUALIFICATION",
    GROUP: "GROUP",
    ATTRIBUTE: "ATTRIBUTE",
    TEXT: "TEXT",
    VALUE: "VALUE",
}