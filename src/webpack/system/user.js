import {Sidebar} from "../sidebar/sidebar";
import {rolesPlugin} from "../sidebar/plugins/plugin-roles";

import {groupActions, systemActions} from "../actions/actions";
import InteractiveListStandaloneComponent from "../components/interactiveListStandalone";
import ComponentObserver from "../components/ComponentObserver";
import {Snackbar} from "../helpers/snackbar";
import {systemPlugin} from "../sidebar/plugins/plugin-system";
import ComponentPage from "../components/ComponentPage";


var actions = window.actions;


let user = {
    title: "system.user",
    pageData: {},
    init: function (args) {
        let self  = this;
        self.initPromise = new Promise(function(resolve, reject){
            $(document).ready(function () {

                //debug line, remove before flight
                console.log("loading js module: "+self.title);

                self.pageData = {};
                var lidlRTO = window.lidlRTO;

                window.snackbar = new Snackbar();

                systemActions.getSystemSettings()
                    .then(settings => {
                        self.buildPage({},{systemSettings: settings});
                    })
            })
        })
    },
    buildPage: function(args={}, data={}) {
        let self = this;
        var lidlRTO = window.lidlRTO;

        var sidebar = new Sidebar('wrapper');
        sidebar.addPlugin(systemPlugin);

        return new Promise(function(resolve, reject){

            let pageContainer = document.getElementById("systemPage-component-container");
            var systemPage = new ComponentPage({
                container: pageContainer,
                sidebar: sidebar,
                data: {
                    systemSettings: data.systemSettings,
                },
                args: {},
            });
            window.systemPage = systemPage;
            systemPage.addComponent(ComponentPage.componentTypes.SYSTEM.MEMBER_CREATION, {allowEdit: true, size: "full"}, {systemSettings: data.systemSettings});
        })

    },
    updatePage: function(user, args){
        return this.buildPage(user, args)
    },
};

export {user}