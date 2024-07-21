import PageModuleLoader from "../utils/PageModuleLoader";
import User from "./user"
import Qualifications from "./qualifications"
import Mail from "./mail"
import Auth from "./auth"
import Groups from "./groups"
import Dev from "./dev"
import Events from "./events"
import Logs from "./logs"


$(document).ready(function () {

    const moduleName = "system";

    const loader = new PageModuleLoader(moduleName);


    loader.addModules([User, Qualifications, Mail, Auth, Events, Groups, Dev, Logs]);
    loader.execute();


});
