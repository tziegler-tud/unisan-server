import "./events.scss";
var checkboxradio = require("jquery-ui/ui/widgets/checkboxradio");
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";

import "/lib/evo-calendar/evo-calendar/js/evo-calendar.js";
import ComponentPage from "../components/ComponentPage";
import {UserProfile} from "../userprofile/userprofile";
import aclActions from "../actions/aclActions";

let events = {
    title: "events",
    data: {},
    init: async function () {
        let self = this;
        var currentUserProfile = (window.currentUserProfile !== undefined) ? window.currentUserProfile : new UserProfile(window.userId);
        var ob1 = new lidlObserver((u) => {
            this.pageData.user = u;
        });
        //debug line, remove before flight
        console.log("loading js module: dashboard."+self.title);

        self.view = "both";
        self.sort = "date.startDate";
        self.calendar = null;
        self.upcomingList = null;
        self.pastList = null;
        self.data = {all: [], upcoming: [], past: []};
        self.calendarContainer = document.getElementById('eventcalendar-container');

        const currentUser = await currentUserProfile.getUserAndSubscribe(ob1);

        let dockerACL = undefined;
        let allowCreateEvent = false;
        try {
            dockerACL = await aclActions.getCurrentUserDockerAcl();
            allowCreateEvent = dockerACL.events.create;
        }
        catch(e) {
            console.error("Failed to get user acl. This might lead to incorrect display")
        }

        const data = {
            user: currentUser,
            targetUser: currentUser,
        }

        let pageContainer = document.getElementById("userPage-component-container");
        var componentPage = new ComponentPage({
            container: pageContainer,
            sidebar: undefined,
            data: data,
            args: {},
        });
        window.componentPage = componentPage;
        componentPage.addSection({identifier: "CALENDAR", order: 1, title: "Kalender", displayMode: "hidden", disableMargins: true, disableComponentMargins: true})
        await componentPage.addComponent({
            componentType: ComponentPage.componentTypes.EVENTS.CALENDAR,
            section:"CALENDAR",
            componentArgs: {allowEdit: true, size: "full", acl: dockerACL},
            data: {user: data.user, allowCreateEvent: allowCreateEvent}
        })

        componentPage.addSection({identifier: "EVENTS", order: 2, title: "Meine Events", displayMode: "hidden", disableMargins: true, disableComponentMargins: true})
        await componentPage.addComponent({
            componentType: ComponentPage.componentTypes.USER.EVENTS,
            section:"EVENTS",
            componentArgs: {allowEdit: true, size: "full"},
            data: {user: data.user, targetUser: data.targetUser}
        })
    },
}

export {events}