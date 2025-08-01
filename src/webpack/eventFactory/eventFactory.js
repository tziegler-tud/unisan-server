import "./eventFactory.scss";

//load settings modules
import eventFactoryDetails from "./eventFactoryDetails";
import eventBlueprintPostings from "./eventFactoryPostings";
// import eventBlueprintLogs from "./eventBlueprintLogs.js";
// import eventBlueprintSettings from "./eventBlueprintSettings.js";
import eventFactoryOverview from "./eventFactoryOverview";

import PageModuleLoader from "../utils/PageModuleLoader";

$(document).ready(function () {
    const moduleName = "eventFactory";

    const loader = new PageModuleLoader(moduleName);
    loader.addModules([eventFactoryOverview, eventFactoryDetails, eventBlueprintPostings]);
    // loader.addModules([eventBlueprintLogs, eventBlueprintSettings, eventBlueprintOverview, eventBlueprintDetails, eventBlueprintPostings]);
    loader.execute();
});
