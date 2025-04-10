import {UserProfile} from "../userprofile/userprofile";
import {actions} from "../actions/actions";
import ScrollableList from "../scrollableList/ScrollableList"

import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";
import {DropdownMenu} from "../helpers/dropdownMenu";
import PageModule from "../utils/PageModule";
import {Snackbar} from "../helpers/snackbar";


export default new PageModule ({
    title: "user.logs",
    pageData: {},
    init: async function (args) {
        var lidlRTO = window.lidlRTO;
        var currentExploredUser;

        var currentUserProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);

        var targetUserProfile = new UserProfile(window.exploreUserId);

        // create new observer
        var ob1 = new lidlObserver((u) => {
            this.pageData.user = u;
        });

        var ob2 = new lidlObserver((u) => {
            this.pageData.exploredUser = u;
        });
        window.snackbar = new Snackbar();

        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});


        // get user data from user service
        //subscribe as observer to get notification if user changes on server
        let userPromise = profile.getUserAndSubscribe(ob1);

        const currentUser = await currentUserProfile.getUserAndSubscribe(ob1);
        const targetUser = await targetUserProfile.getUserAndSubscribe(ob1);


        const data = {
            user: currentUser,
            targetUser: this.pageData.exploredUser
        }

        return {args, data}
    },

    buildPage: async function({args={}, data={}}={}) {

        // window.DockerElement = new docker.Docker(window.dockerArgs);
        window.DockerElement.addDockerSubPage("userEdit", user, {}, undefined, {currentUser: {edit: window.allowedit}});
        currentExploredUser = user;
        var userid = window.exploreUserId;

        const menu = new DropdownMenu("#mdc-dropdown", "click", "#mdc-dropdown-trigger", {});

        //get Logs for user
        actions.getLogs(user.id, "ALL", {
            onSuccess: function(result){
                let container = document.getElementById('loglist-container');
                let args = {
                    height: "full",
                    sorting: {
                        property: "timestamp",
                        direction: -1,
                    }
                }
                let callback = {
                    listItem: {
                        onClick: function(e){
                            let self = e.currentTarget;
                            e.preventDefault();
                            //get full log from results
                            let logObj = result.find(function(el){
                                return el.id === self.dataset.logid;
                            })
                            sidebar.addContent("logDetails", {
                                log: logObj
                            });
                            sidebar.show();
                        }
                    }
                }
                let scrollableList = new ScrollableList(container, "log", result, args, callback)
                // displayLogList(result);
            }
        })
    }
});