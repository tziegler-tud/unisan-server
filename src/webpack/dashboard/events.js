import "./events.scss";

import {ScrollableList} from "../scrollableList/scrollableList";
import {Searchbar} from "../searchbar/searchbar";
import {dateFromNow} from "../helpers/helpers";

var checkboxradio = require("jquery-ui/ui/widgets/checkboxradio");
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer";

import "/lib/evo-calendar/evo-calendar/js/evo-calendar.js";
import ComponentPage from "../components/ComponentPage";
import {UserProfile} from "../userprofile/userprofile";

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
        await componentPage.addComponent({
            componentType: ComponentPage.componentTypes.EVENTS.CALENDAR,
            componentArgs: {allowEdit: true, size: "full"},
            data: {user: data.user, targetUser: data.targetUser}
        })
        await componentPage.addComponent({
            componentType: ComponentPage.componentTypes.USER.EVENTS,
            componentArgs: {allowEdit: true, size: "full"},
            data: {user: data.user, targetUser: data.targetUser}
        })

        self.getData(window.userId, "", self.sort)
            .then(all => {
                self.data.all = all;
                self.showCalendar();
            })
            .catch(err => {
                throw err
            })
    },
}

export {events}