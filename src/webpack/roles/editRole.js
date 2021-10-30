import {Sidebar} from "../sidebar/sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";
import {groupActions} from "../actions/groupActions";
import {Userlist} from "../helpers/userlist";



$(document).ready (function () {
    var lidlRTO = window.lidlRTO;
    var common = window.common;
    var actions = window.actions;


    //group is in window.group
    let group = window.group;
    var groupId = window.groupId;

    // window.DockerElement = new docker.Docker(window.dockerArgs);
    window.DockerElement.addDockerSubPage("role", group, {});
    //init sidebar
    let addDBKey_sidebar = new Sidebar('wrapper', "test");
    addDBKey_sidebar.addPlugin(rolesPlugin);



    const deleteContent = {
        title: "Gruppe löschen",
        message: "Achtung: Unüberlegtes Löschen von Gruppen kann dazu führen, dass kein Nutzer Zugriff besitzt, um neue Rechte zu verteilen. Wirklich Fortfahren?",
        titleArg: "",
        messageArg: ""
    };

    var deleteArgs = {
        id: groupId,
        callback: {
            onConfirm: function () {
                groupActions.removeGroup(groupId)
            }
        }
    };

    var token = lidlRTO.objectManager.createNewObjectToken();
    const dialogDeleteUser = new lidl.Dialog(token, ".deleteGroupButton", 'confirmDelete', deleteContent, deleteArgs);
    lidlRTO.objectManager.addObject(dialogDeleteUser, token);

    $(".addUserButton").on("click", function (e) {
        e.preventDefault();
        addDBKey_sidebar.addContent('addUserToGroup', {
                group: group,
                groupId: groupId,
                callback: {
                    onConfirm: function (data, args) {
                        groupActions.addUser(data, args);
                    }
                }
            },
        );
        addDBKey_sidebar.show();
    });

    $(".editGroupButton").on("click", function (e) {
        e.preventDefault();
        addDBKey_sidebar.addContent('changeGroup', {
                group: group,
                groupId: groupId,
                callback: {
                    onConfirm: function (id, data, args) {
                        groupActions.changeGroup(id, data, args);
                    }
                }
            },
        );
        addDBKey_sidebar.show();
    });

    $(".addPathButton").on("click", function (e) {
        e.preventDefault();
        addDBKey_sidebar.addContent('addGroupPath', {
                group: group,
                groupId: groupId,
                callback: {
                    onConfirm: function (id, data, args) {
                        groupActions.addPermission(id, data, args);
                    }
                }
            },
        );
        addDBKey_sidebar.show();
    });

    $(".changePathEntry").on("click", function (e) {
        e.preventDefault();
        addDBKey_sidebar.addContent('addGroupPath', {
                group: group,
                groupId: groupId,
                permission: {
                    method: e.dataset.method,
                    url: e.dataset.url,
                },
                callback: {
                    onConfirm: function (id, data, args) {
                        groupActions.addPermission(id, data, args);
                    }
                }
            },
        );
        addDBKey_sidebar.show();
    });

    const addToAllContent = {
        title: "Gruppe allen Nutzern zuweisen",
        message: "Alle Nutzer werden dieser Gruppe hinzugefügt. Fortfahren?",
        titleArg: "",
        messageArg: ""
    };

    var addToAllArgs = {
        id: groupId,
        callback: {
            onConfirm: function () {
                groupActions.addGroupToAllUser(groupId);
            }
        }
    };

    var token2 = lidlRTO.objectManager.createNewObjectToken();
    const dialogAddToAll = new lidl.Dialog(token2, ".addToAllButton", 'confirmDelete', addToAllContent, addToAllArgs);
    lidlRTO.objectManager.addObject(dialogAddToAll, token2);

    let listData = {
        group: group,
        user: window.assignedUser,
    }
    let userlist = new Userlist("userlist-container", listData, "/webpack/templates/userlist.hbs", true);
    //TODO: Unfinished. needs to be continued

});