import {Sidebar} from "../sidebar/sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";
import {groupActions} from "../actions/groupActions";



$(document).ready (function () {
    var lidlRTO = window.lidlRTO;
    var common = window.common;
    var actions = window.actions;


    //group is in window.group
    let group = window.group;

    // window.DockerElement = new docker.Docker(window.dockerArgs);
    window.DockerElement.addDockerSubPage("role", group, {});
    //init sidebar
    let addDBKey_sidebar = new Sidebar('wrapper', "test");
    addDBKey_sidebar.addPlugin(rolesPlugin);

    var groupId = window.groupId;

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
                groupActions.removeGroup(id)
            }
        }
    };

    var token = lidlRTO.objectManager.createNewObjectToken();
    const dialogDeleteUser = new lidl.Dialog(token, ".deleteRoleButton", 'confirmDelete', deleteContent, deleteArgs);
    lidlRTO.objectManager.addObject(dialogDeleteUser, token);

    $(".addUserButton").on("click", function (e) {
        e.preventDefault();
        addDBKey_sidebar.addContent('addUserToGroup', {
                callback: {
                    onConfirm: function (data, args) {
                        groupActions.addUser(data, args);
                    }
                }
            },
        );
        addDBKey_sidebar.show();
    });

});