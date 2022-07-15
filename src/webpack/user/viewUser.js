import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";
import {userActions} from "../actions/userActions";
import {UserProfile} from "../userprofile/userprofile";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";
import {DropdownMenu} from "../helpers/dropdownMenu";

import {lidl} from "/src/lib/lidl-modules/core/lidlModular-0.2";
import {Observer as lidlObserver} from "/src/lib/lidl-modules/observer/lidl-observer";
import {Dialog as lidlDialog} from "/src/lib/lidl-modules/dialog/lidl-dialog";

$(document).ready (function () {

    var lidlRTO = window.lidlRTO;
    var common = window.common;
    var actions = window.actions;

    var currentExploredUser;
    var profile = new UserProfile(window.exploreUserId);

    // create new observer
    var observer = new lidlObserver(function(user){
        currentExploredUser = user;
    });

    // get user data from user service
    //subscribe as observer to get notification if user changes on server
    profile.getUserAndSubscribe(observer)
        .then(function(user){
            buildPage(user)
        })
        .catch(function(reason){
            console.error("Failed to retrieve user data:" + reason)
        });

    function buildPage(user) {

        // window.DockerElement = new docker.Docker(window.dockerArgs);
        window.DockerElement.addDockerSubPage("user", user, {}, undefined, {currentUser: {edit: false}});


        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});

        var addDBKey_sidebar = new Sidebar('wrapper', "test");
        addDBKey_sidebar.addPlugin(userPlugin);


        $(".quallist-entry").on("click", function(e) {
            e.preventDefault();
            var self = this;

            addDBKey_sidebar.addContent('UserViewQualification', {
                    userid: user.id,
                    qualificationId: self.dataset.keyid,
                    callback: {
                        onConfirm: function(){
                        },
                    },
                },
            );
            addDBKey_sidebar.show();
        });

        let listContainer = document.getElementById("qualification-list")
        if(listContainer) {
            let listElem = new ScrollableList(listContainer, "userQualification", user.qualifications,
                {
                    sorting: {
                        property: "qualification.qualType",
                        direction: "asc",
                    },

                },
                {
                    listItem: {
                        onClick: function (e) {
                            e.preventDefault();
                            var self = e.currentTarget;

                            addDBKey_sidebar.addContent('UserViewQualification', {
                                    userid: user.id,
                                    qualificationId: self.dataset.keyid,
                                    callback: {
                                        onConfirm: function () {
                                        },
                                    },
                                },
                            );
                            addDBKey_sidebar.show();
                        }
                    }
                });
        }

        const token2 = lidlRTO.objectManager.createNewObjectToken();
        const dialog02 = new lidlDialog(token2, ".viewProfilePicture", 'imageUpload',
            {title: "Mitgliedsakte: Passbild"},
            {
            userid: user.id,
            callback: {
                onConfirm: function () {
                }
            }}
            , {});
        lidlRTO.objectManager.addObject(dialog02, token2);

        // $(".userkey-entry").on("click", function(e) {
        //     e.preventDefault();
        //     var self = this;
        //
        //     addDBKey_sidebar.addContent('UserViewDBKey', {
        //             userid: user.id,
        //             keyId: self.dataset.keyid,
        //             key: self.dataset.key,
        //             catKey: self.dataset.catkey,
        //             subKey: self.dataset.subkey,
        //             value: self.dataset.value,
        //             callback: {
        //
        //             },
        //         },
        //     );
        //     addDBKey_sidebar.show();
        // });

    }
});