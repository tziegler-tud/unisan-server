import Handlebars from "handlebars";
import {userActions} from "../../../actions/actions";
import {ComponentPage} from "../../ComponentPage";
import Component from "../../Component";
import InteractiveListStandaloneComponent from "../../interactiveListStandalone";
import ComponentObserver from "../../ComponentObserver";
import {Searchbar} from "../../../searchbar/searchbar";
import {dateFromNow} from "../../../helpers/helpers";
import {ScrollableList} from "../../../scrollableList/scrollableList";


export default class UserEventsComponent extends Component {
    /**
     *
     * @param page {ComponentPage} parent page instance
     * @param componentId {String} component id number, assigend by page on creation
     * @param componentType {ComponentPage.componentTypes} type of the component
     * @param data {Object}
     * @param data.user {Object} current user object
     * @param data.targetUser {String | Object} target user object or "current" (default)
     * @param args {Object}
     * @returns {UserMailSettingsComponent}
     * @constructor
     */
    constructor({page, section, componentId,  pageData={}, data={}, args={}}={}) {
        super({page, section, componentId,  pageData, data, args});
        if (this.data.targetUser === "current") this.data.targetUser = this.data.user;
        if(this.data.targetUser === undefined) throw new Error("Invalid Arguments received: targetUser cannot be undefined.")
        this.templateUrl = "/webpack/components/templates/user/UserEvents.hbs"
    }

    async postRender(){
        this.targetUserId = this.data.targetUser.id.toString();
        this.viewConfig = {sort: "date.startDate", order: "desc"};
        this.upcomingList = null;
        this.pastList = null;
        this.eventData = {upcoming: [], past: []};
        this.upcomingListContainer = document.getElementById('eventlist-container--upcoming');
        this.pastListContainer = document.getElementById('eventlist-container--past');
        const searchbarContainerUpcoming = document.getElementById("eventsearch--upcoming");
        const searchbarContainerPast = document.getElementById("eventsearch--past");

        //setup searchbar
        this.searchbarUpcoming = new Searchbar(searchbarContainerUpcoming, {
            onInput: {
                enabled: true,
                callback: (inputValue)=>{
                    this.getUpcomingEvents(inputValue)
                        .then(data => {
                            this.eventData.upcoming = data;
                            this.showUpcoming();
                            return this;
                        })
                        .catch(err => {
                            console.error(err)
                        })
                },
            },
        });
        let filterDate = dateFromNow({weeks: -4});
        this.searchbarPast = new Searchbar(searchbarContainerPast, {
            onInput: {
                enabled: true,
                callback: (inputValue)=>{
                    this.getPastEvents(inputValue)
                        .then(data => {
                            this.eventData.past = data;
                            this.showPast();
                            return this;
                        })
                        .catch(err => {
                            console.error(err)
                        })
                },
            },
        });

        this.data.upcoming = await this.getUpcomingEvents()
        this.data.past = await this.getPastEvents()

        this.showUpcoming();
        this.showPast();
    }

    getHtml(){
        return this.html;
    }

    showUpcoming(){
        let upcoming = this.data.upcoming;
        this.upcomingList = this.displayEventList(upcoming, this.upcomingListContainer,  this.viewConfig.sort, 1);
        // self.searchbarUpcoming.show();
    }

    showPast(){
        let past = this.eventData.past;
        this.pastList = this.displayEventList(past, this.pastListContainer, this.viewConfig.sort, -1);
        // self.searchbarUpcoming.show();
    };

    getPastEvents(matchString){
        const endDate = Date.now();
        return this.getEvents({
            userId: this.targetUserId,
            matchString: matchString,
            endDate: endDate,
            amount: 5
        });
    }

    getUpcomingEvents(matchString){
        const startDate = Date.now();
        return this.getEvents({
            userId: this.targetUserId,
            matchString: matchString,
            startDate: startDate
        });
    }
    getEvents({
        userId,
        matchString="",
        startDate,
        endDate,
        sort=this.viewConfig.sort,
        amount
              }){

        let data = {
            userid: userId,
            matchString: matchString,
            startDate: startDate,
            endDate: endDate,
            sort: sort,
            amount: amount
        }
        //get user list from server
        return new Promise(function(resolve, reject){
            $.ajax({
                url: "/api/v1/eventmod/userevents/",
                type: 'POST',
                contentType: "application/json; charset=UTF-8",
                dataType: 'json',
                data: JSON.stringify(data),
                success: function(events) {
                    resolve(events)
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("Error: " + XMLHttpRequest.status + " " + XMLHttpRequest.statusText);
                    reject(errorThrown)
                }
            });
        })
    }
    displayEventList(events, container, sort="date.startDate", direction=1){
        let args = {
            height: "fixed",
            fixedHeight: "500px",
            sorting: {
                property: sort,
                direction: direction,
            }
        }
        let callback = {
            listItem: {
                onClick: function(e){
                    let self = e.currentTarget;
                    e.preventDefault();
                    window.location = "/unisams/events/view/"+self.dataset.id;

                }
            }
        }

        return new ScrollableList(container, "event", events, args, callback)
    }
}