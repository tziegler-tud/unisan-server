import {groupActions} from "../actions/groupActions";
import Sidebar from "../sidebar/Sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";
import {userActions} from "../actions/userActions";
import {Userlist} from "../helpers/userlist";

import {lidl} from "/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/lib/lidl-modules/dialog/lidl-dialog";


let advanced = {
    init: function() {
        $(document).ready(function () {

            var lidlRTO = window.lidlRTO;

            var actions = window.actions;


            //group is in window.group
            let group = window.group;
            var groupId = window.groupId;

            //debug line, remove before flight
            console.log("loading js module: roles.advanced");

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
            const dialogDeleteUser = new lidlDialog(token, ".deleteGroupButton", 'confirmDelete', deleteContent, deleteArgs);
            lidlRTO.objectManager.addObject(dialogDeleteUser, token);

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
                addDBKey_sidebar.addContent('updateGroupPath', {
                        group: group,
                        groupId: groupId,
                        operation: e.currentTarget.dataset.operation,
                        callback: {
                            onConfirm: function (id, data, args) {
                                groupActions.updatePermission(id, data, args);
                            },
                            onDelete: function(id, data, args){
                                groupActions.removePermission(id, data, args);
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
            const dialogAddToAll = new lidlDialog(token2, ".addToAllButton", 'confirmDelete', addToAllContent, addToAllArgs);
            lidlRTO.objectManager.addObject(dialogAddToAll, token2);

            const removeFromAllContent = {
                title: "Gruppe allen Nutzern zuweisen",
                message: "Alle Nutzer werden aus dieser Gruppe entfernt. Fortfahren?",
                titleArg: "",
                messageArg: ""
            };

            var removeFromAllArgs = {
                id: groupId,
                callback: {
                    onConfirm: function () {
                        groupActions.removeGroupFromAllUser(groupId);
                    }
                }
            };

            var token3 = lidlRTO.objectManager.createNewObjectToken();
            const dialogRemoveFromAll = new lidlDialog(token3, ".removeFromAllButton", 'confirmDelete', removeFromAllContent, removeFromAllArgs);
            lidlRTO.objectManager.addObject(dialogAddToAll, token3);
        });
    }
}

export {advanced}

