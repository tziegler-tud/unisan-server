const mongoose = require('mongoose');
const authEnums = require('../services/authEnums');

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
            type: Schema.Types.ObjectId,
            ref: "Event",
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
                apps: {
                    protocol: true,
                }
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

module.exports = mongoose.model('UserACL', UserACLSchema);