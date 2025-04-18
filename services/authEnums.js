
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
    NEWSADMIN: "newsAdmin",
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
        WRITE: "writeUser", //write non-critical properties on all user documents
        CREATE: "createUser", //create user
        DELETE: "deleteUser", //delete user
        READSELF: "readUserSelf", //read own user document
        WRITESELF: "writeUserSelf", //write non-critical properties on own user document
        WRITECRITICAL: "writeUserCritical", // write critical properties on all user documents (passwords)
    },
    events: {
        READ: "readEvent",
        WRITE: "writeEvent",
        CREATE: "createEvent",
        DELETE: "deleteEvent",
    },
    news: {
        READ: "readNews",
        WRITE: "writeNews",
        CREATE: "createNews",
        DELETE: "deleteNews",
    },
    access: {
        READACL: "readAcl",
        WRITEACL: "writeAcl",

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
    groups: {
        READ: "readGroups",
        WRITE: "writeGroups",
        CREATE: "createGroups",
        DELETE: "deleteGroups",
    },
    system: {
        QUALIFICATIONS: "manageQualificationSettings",
        LOGS: "manageSystemLogs",
        EVENTS: "manageEventSettings",
        USER: "manageUserSettings",
        GOUPS: "manageGroupSettings",
        SYSTEM: "manageSystemSettings",
        MAIL: "manageMailSettings",
        AUTH: "manageAuthenticationSettings",
        DEVELOPMENT: "manageDevelopmentSettings",
    }
}

export default {
    rolesMap : rolesMap,
    rolesEnum : rolesEnum,
    groupsEnum : groupsEnum,
    groupActionsEnum : groupActionsEnum,
    roles : roles,
    operations : operations,
}