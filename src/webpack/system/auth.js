import {UserProfile} from "../userprofile/userprofile";
import Snackbar from "../helpers/snackbar";
import Sidebar from "../sidebar/Sidebar";
import {systemPlugin} from "../sidebar/plugins/plugin-system";
import ComponentPage from "../components/ComponentPage";
import {systemActions} from "../actions/systemActions";
import PageModule from "../utils/PageModule";

export default new PageModule({
    title: "system.auth",
    pageData: {},
    init: async function (args) {
        var lidlRTO = window.lidlRTO;
        window.snackbar = new Snackbar();

        const settings = await systemActions.getSystemSettings()
        const clients = await systemActions.getOidcClients()
        const cookieSecrets = await systemActions.getOidcCookieSecrets();
        let data = {
            enabled: settings.auth.openid.enabled,
            issuer: settings.auth.openid.issuer,
            port: settings.auth.openid.port,
            cookieSecrets: cookieSecrets.cookieSecrets,
            clients: clients,
        }
        return {args: {}, data: data};
    },
    buildPage: async function({args={}, data={}}={}) {
        var lidlRTO = window.lidlRTO;

        var sidebar = new Sidebar('wrapper');
        sidebar.addPlugin(systemPlugin);

        return new Promise(function (resolve, reject) {

            let pageContainer = document.getElementById("systemPage-component-container");
            var systemPage = new ComponentPage({
                container: pageContainer,
                sidebar: sidebar,
                data: {},
                args: {},
            });
            window.systemPage = systemPage;
            systemPage.addComponent({
                componentType: ComponentPage.componentTypes.SYSTEM.OPENID,
                componentArgs: {
                    allowEdit: true,
                    size: "full"
                },
                data: {
                    enabled: data.enabled,
                    issuer: data.issuer,
                    port: data.port,
                    cookieSecrets: data.cookieSecrets,
                    clients: data.clients
                }
            });
        })

    },
    updatePage: async (user, args) => {
        return this.buildPage(user, args)
    },
});