import {Snackbar} from "../helpers/snackbar";
import Sidebar from "../sidebar/Sidebar.js";
import {systemPlugin} from "../sidebar/plugins/plugin-system";
import ComponentPage from "../components/ComponentPage";
import {systemActions} from "../actions/actions";
import PageModule from "../utils/PageModule";

export default new PageModule({
    title: "system.mail",
    pageData: {},
    init: async function (args) {
        //debug line, remove before flight
        console.log("loading js module: " + this.title);
        this.pageData = {};
        window.snackbar = new Snackbar();

        const settings = await systemActions.getSystemSettings()
        let data = {
            enabled: settings.mail.enabled,
            createAccountOnUserCreation: settings.mail.createAccountOnUserCreation,
            deleteAccountOnUserDeletion: settings.mail.deleteAccountOnUserDeletion,
            url: settings.mail.url,
            port: settings.mail.port,
            baseUrl: settings.mail.baseUrl,
            apiKey: settings.mail.apiKey,
            domain: settings.mail.domain,
        }
        return {args, data};
    },
    buildPage: async function({args={}, data={}}={}) {
        var lidlRTO = window.lidlRTO;

        var sidebar = new Sidebar('wrapper');
        sidebar.addPlugin(systemPlugin);

        let pageArgs = {

        };

        let pageData = {

        }

        try {
            pageArgs.acl = await $.get("/api/v1/acl/current");
        }
        catch(e) {
            console.error("Failed to get user acl. This might lead to incorrect display")
        }


        return new Promise(function(resolve, reject){

            let pageContainer = document.getElementById("systemPage-component-container");
            var systemPage = new ComponentPage({
                container: pageContainer,
                sidebar: sidebar,
                data: pageData,
                args: pageArgs,
            });
            window.systemPage = systemPage;
            systemPage.addComponent({componentType: ComponentPage.componentTypes.SYSTEM.MAIL, componentArgs: {allowEdit: true, size: "full"}, data: data});
        })

    },
});