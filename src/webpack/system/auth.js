import {UserProfile} from "../userprofile/userprofile";
import {Snackbar} from "../helpers/snackbar";
import {DropdownMenu} from "../helpers/dropdownMenu";
import {Sidebar} from "../sidebar/sidebar";
import {systemPlugin} from "../sidebar/plugins/plugin-system";
import ComponentPage from "../components/ComponentPage";
import {systemActions} from "../actions/actions";

let auth = {
    title: "system.auth",
    pageData: {},
    init: function (args) {
        let self  = this;
        self.initPromise = new Promise(function(resolve, reject){
            $(document).ready(function () {

                //debug line, remove before flight
                console.log("loading js module: user."+self.title);

                self.pageData = {};
                var lidlRTO = window.lidlRTO;

                window.snackbar = new Snackbar();

                systemActions.getSystemSettings()
                    .then(settings => {
                        //get clients
                        systemActions.getOidcClients()
                            .then(clients => {
                                let data = {
                                    enabled: settings.auth.openid.enabled,
                                    issuer: settings.auth.openid.issuer,
                                    port: settings.auth.openid.port,
                                    cookieSecrets: settings.auth.openid.cookieSecrets,
                                    clients: clients,
                                }
                                return self.buildPage(args, data)
                            })
                    })
            })
        })
    },
    buildPage: function(args, data) {
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

                },
                args: {},
            });
            window.systemPage = systemPage;
            systemPage.addComponent(ComponentPage.componentTypes.SYSTEM.OPENID, {allowEdit: true, size: "full"}, {enabled: data.enabled, issuer: data.issuer, port: data.port, cookieSecrets: data.cookieSecrets, clients: data.clients});
        })

    },
    updatePage: function(user, args){
        return this.buildPage(user, args)
    },
};

export {auth}