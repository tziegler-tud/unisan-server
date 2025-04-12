import "./event.scss";

//load settings modules
import eventDetails from "./eventDetails.js";
import eventParticipants from "./eventParticipants.js";
import eventLogs from "./eventLogs.js";
import eventSettings from "./eventSettings.js";
import eventOverview from "./eventOverview";

import PageModuleLoader from "../utils/PageModuleLoader";

$(document).ready(function () {
    const moduleName = "events";

    const loader = new PageModuleLoader(moduleName);
    loader.addModules([eventLogs, eventSettings, eventOverview, eventDetails, eventParticipants]);
    loader.execute();
});
