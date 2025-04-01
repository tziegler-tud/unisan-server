import PageModuleLoader from "../utils/PageModuleLoader";
import general from "./generalSettings"
import login from "./loginSettings"
import mail from "./mailSettings"
import notifications from "./notificationsSettings"
import privacy from "./privacySettings"

$(document).ready(function () {
    const moduleName = "settings";
    const loader = new PageModuleLoader(moduleName);
    loader.addModules([general, login, mail, notifications, privacy]);
    loader.execute();
});
