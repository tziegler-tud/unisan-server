
let rolesMap = {
    "protected": -1,
    "member": 1,
    "admin": 2,
    "superadmin": 3,
}

let rolesEnum = {
    PROTECTED: "protected",
    MEMBER: "member",
    ADMIN: "admin",
    SUPERADMIN: "superadmin",
}

let groupsEnum = {
    MEMBER: "member",
    USERADMIN: "userAdmin",
    EVENTADMIN: "eventAdmin",
    ACLADMIN: "aclAdmin",
    SYSADMIN: "systemAdmin"
}

let groupActionsEnum = {
    GRANT: "grantGroup",
    REVOKE: "revokeGroup",
}

let roles = [
    "protected",
    "member",
    "admin",
    "superadmin",
]

let operations = {
    user: {
        READ: "readUser", //read all user documents
        WRITE: "writeUser", //write all user documents
        CREATE: "createUser", //create user
        DELETE: "deleteUser", //delete user
        READSELF: "readUserSelf", //read own user document
        WRITESELF: "writeUserSelf", //write non-critical properties on own user docuemnt
    },
    events: {
        READ: "readEvent",
        WRITE: "writeEvent",
        CREATE: "createEvent",
        DELETE: "deleteEvent",
    },
    access: {
        READUSERROLE: "readUserRole",
        WRITEUSERROLE: "writeUserRole",

        GRANTUSERGROUPS: "grantUserGroups", //grant non-admin user groups
        REVOKEUSERGROUPS: "revokeUserGroups", //revoke non-admin user groups

        GRANTEVENTCONTROL: "grantEventControl",
        REVOKEEVENTCONTROL: "revokeEventControl",

        GRANTUSERADMINRIGHTS: "grantUserRights", //grant user admin rights to other users
        REVOKEUSERADMINRIGHTS: "revokeUserRights", //revoke user admin rights from other users

        GRANTEVENTADMINRIGHTS: "grantEventRights", //grant event admin rights to other users
        REVOKEEVENTADMINRIGHTS: "revokeEventRights", //revoke event admin rights from other users

        GRANTSYSTEMADMINRIGHTS: "grantSystemAdminRights", //grant system admin rights to other users
        REVOKESYSTEMADMINRIGHTS: "revokeSystemAdminRights", //revoke system admin rights from other users
    },
    settings: {
        LOGS: "manageSystemLogs",
        EVENTS: "manageEventSettings",
        USER: "manageUserSettings",
        GOUPS: "manageGroupSettings",
        SYSTEM: "manageSystemSettings",
    }
}

let operationsAll = {
    USERREAD: "readUser", //read all user documents
    USERWRITE: "writeUser", //write all user documents
    USERCREATE: "createUser", //create user
    USERDELETE: "deleteUser", //delete user
    USERREADSELF: "readUserSelf", //read own user document
    USERWRITESELF: "writeUserSelf", //write non-critical properties on own user document

    EVENTREAD: "readEvent",
    EVENTWRITE: "writeEvent",
    EVENTCREATE: "createEvent",
    EVENTDELETE: "deleteEvent",

    READUSERROLE: "readUserRole",
    WRITEUSERROLE: "writeUserRole",

    GRANTUSERGROUPS: "grantUserGroups", //grant non-admin user groups
    REVOKEUSERGROUPS: "revokeUserGroups", //revoke non-admin user groups

    GRANTUSERADMINRIGHTS: "grantUserRights", //grant user admin rights to other users
    REVOKEUSERADMINRIGHTS: "revokeUserRights", //revoke user admin rights from other users

    GRANTEVENTADMINRIGHTS: "grantEventRights", //grant event admin rights to other users
    REVOKEEVENTADMINRIGHTS: "revokeEventRights", //revoke event admin rights from other users

    GRANTSYSTEMADMINRIGHTS: "grantSystemAdminRights", //grant system admin rights to other users
    REVOKESYSTEMADMINRIGHTS: "revokeSystemAdminRights", //revoke system admin rights from other users
}

module.exports.rolesMap = rolesMap;
module.exports.rolesEnum = rolesEnum;
module.exports.groupsEnum = groupsEnum;
module.exports.groupActionsEnum = groupActionsEnum;
module.exports.roles = roles;
module.exports.operations = operations;
module.exports.operationsAll = operationsAll;