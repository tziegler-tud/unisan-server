import {groupActions} from "../actions/groupActions";
import {Sidebar} from "../sidebar/sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";
import {userActions} from "../actions/userActions";
import {Userlist} from "../helpers/userlist";


let view = {
    init: function() {
        $(document).ready(function () {
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

            //debug line, remove before flight
            console.log("loading js module: roles.view");

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

            let listData = {
                group: group,
                user: window.assignedUser,
            }
            let userlist = new Userlist("userlist-container", listData, "/webpack/roles/templates/userlist.hbs", true);
            userlist.templatePromise
                .then(function(){
                    userlist.addEventHandler(function(){
                        $(".userlist-delete").click(function(e){
                            let userid = this.dataset.userid;
                            let data = {
                                userGroupId: groupId,
                                userId: userid,
                            }
                            let args = {};
                            userActions.removeGroup(data, args)
                        })
                    })
                });


        });
    }
}

export {view}

