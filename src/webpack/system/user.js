import Sidebar from "../sidebar/Sidebar";
import {systemActions} from "../actions/systemActions";
import Snackbar from "../helpers/snackbar";
import {systemPlugin} from "../sidebar/plugins/plugin-system";
import ComponentPage from "../components/ComponentPage";
import PageModule from "../utils/PageModule";

export default new PageModule({
    title: "system.user",
    pageData: {},
    init: async function (args={}) {

        //debug line, remove before flight
        console.log("loading js module: "+this.title);
        this.pageData = {};
        window.snackbar = new Snackbar();

        const settings = await systemActions.getSystemSettings();
        const data = {systemSettings: settings};
        return {args, data}
    },
    buildPage: async function({args={}, data={}}={}) {
        let sidebar = new Sidebar('wrapper');
        sidebar.addPlugin(systemPlugin);
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
        systemPage.addComponent({componentType: ComponentPage.componentTypes.SYSTEM.MEMBER_CREATION, componentArgs: {allowEdit: true, size: "full"}, data: {systemSettings: data.systemSettings}});
    }
})