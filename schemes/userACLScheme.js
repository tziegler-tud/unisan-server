import mongoose from "mongoose";
import authEnums from '../services/authEnums.js';

/** @typedef {{ username: string, firstName: string, lastName: string, email?: string, hash: string, generalData?: { memberId?: string, phone?: string, customData?: any, qualifications: QualificationObject[], hasPhoto: boolean, isDisplayedOnPublic: boolean, loginEnabled: boolean, createdDate: Date } }} UserScheme */
/** @typedef {{ title: string, allowedOperations: {method: string, url: string}} UserGroup */
const Schema = mongoose.Schema;

// create instance of Schema
var UserACLSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId, ref: 'User'
    },
    userRole: {
        type: String,
        default: "member"
    },
    userGroups: [{
        type: Schema.Types.ObjectId,
        ref: "UserGroup",
    }],
    individual: {
        events: [{
            target: {
                type: Schema.Types.ObjectId,
                ref: "Event",
            },
            allowedOperations: [{
                type: String,
            }]
        }],
    },
    docker: {},
});

UserACLSchema.virtual('userRoleString').get(function() {
    let rolesMap = {
        "protected": "Gesperrt",
        "member": "Nutzer",
        "admin": "Administrator",
        "superadmin": "Super-Administrator",
    }
    return rolesMap[this.userRole];
});

UserACLSchema.post("save", function(doc){
    this.updateDockerObject();
})

UserACLSchema.methods.updateDockerObject = function(){
    let self = this;
    //populate
    self.populate("userGroups")
        .then(userACL => {
            let opArray = []
            userACL.userGroups.forEach(group => {
                group.allowedOperations.forEach(operation => {
                    if (!opArray.includes(operation)) opArray.push(operation);
                })
            })
            //map operations to docker arguments
            let docker = {
                user: {
                    read: opArray.includes(authEnums.operations.user.READ),
                    write: opArray.includes(authEnums.operations.user.WRITE),
                    create: opArray.includes(authEnums.operations.user.CREATE),
                    delete: opArray.includes(authEnums.operations.user.DELETE),
                },
                events: {
                    read: opArray.includes(authEnums.operations.events.READ),
                    write: opArray.includes(authEnums.operations.events.WRITE),
                    create: opArray.includes(authEnums.operations.events.CREATE),
                    delete: opArray.includes(authEnums.operations.events.DELETE),
                },
                news: {
                    read: opArray.includes(authEnums.operations.news.READ),
                    write: opArray.includes(authEnums.operations.news.WRITE),
                    create: opArray.includes(authEnums.operations.news.CREATE),
                    delete: opArray.includes(authEnums.operations.news.DELETE),
                },
                apps: {
                    protocol: true,
                },
                system: {
                    qualifications: opArray.includes(authEnums.operations.system.QUALIFICATIONS),
                    logs: opArray.includes(authEnums.operations.system.LOGS),
                    events: opArray.includes(authEnums.operations.system.EVENTS),
                    user: opArray.includes(authEnums.operations.system.USER),
                    groups: opArray.includes(authEnums.operations.system.GOUPS),
                    system: opArray.includes(authEnums.operations.system.SYSTEM),
                    auth: opArray.includes(authEnums.operations.system.AUTH),
                    development: opArray.includes(authEnums.operations.system.DEVELOPMENT),
                }
            }

            //show menu groups if any is allowed
            for (const [key, value] of Object.entries(docker)) {
                let groupEnabled = false;
                for (const [key, boolValue] of Object.entries(value)) {
                    groupEnabled = (groupEnabled || boolValue);
                }
                docker[key].enabled = groupEnabled;
            }

            self.docker = docker;
            self.updateOne({$set: {"docker": docker}})
                .then(result => {
                    console.log("docker object updated successfully.");
                })
                .catch(err => {
                    console.log("error updating docker object: "+ err );
                })
        })
        .catch(err => {})
}

UserACLSchema.set('toJSON', { virtuals: true });

export default mongoose.model('UserACL', UserACLSchema);