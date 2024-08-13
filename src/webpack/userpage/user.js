import "../user/userprofile.scss";
import "./user.scss";

import PageModuleLoader from "../utils/PageModuleLoader";
import Logs from "./logs"
import Events from "./events"
import Settings from "./settings"


$(document).ready(function () {

    const moduleName = "user";

    const loader = new PageModuleLoader(moduleName);
    loader.addModules([Logs, Events, Settings]);
    loader.execute();
});
