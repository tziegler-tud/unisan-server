import PageModule from "../utils/PageModule";

var lidlRTO = window.lidlRTO;

import {Preloader} from "../helpers/preloader"
import ScrollableList from "../scrollableList/ScrollableList";

import Sidebar from "../sidebar/Sidebar";
import {logPlugin} from "../sidebar/plugins/plugin-logs";


export default new PageModule({
    title: "system.logs",
    pageData: {},
    init: async function (args) {
        const plr  = new Preloader();
        plr.show();
        var sidebar = window.sidebar ?? new Sidebar('wrapper', {title: "Test"});
        sidebar.addPlugin(logPlugin);
        window.sidebar = sidebar;

        const data = await new Promise((resolve, reject) => {
            //get logs
            $.ajax({
                url: "/api/v1/logs/get",
                type: 'GET',
                contentType: "application/json; charset=UTF-8",
            })
                .done(function (result) {
                    resolve(result)
                })
                .fail(err => reject(err))
        })
        return {args: {plr: plr, sidebar: sidebar}, data: data};
    },
    buildPage: async function({args={}, data={}}={}) {
        const plr = args.plr ?? window.plr;
        const sidebar = args.sidebar;
        let container = document.getElementById('loglist-container');
        let listArgs = {
            height: "full",
            sorting: {
                property: "timestamp",
                direction: -1,
            }
        }
        let callback = {
            listItem: {
                onClick: function (e) {
                    let self = e.currentTarget;
                    e.preventDefault();
                    //get full log from results
                    let logObj = data.find(function (el) {
                        return el.id === self.dataset.logid;
                    })
                    sidebar.addContent("logDetails", {
                        log: logObj
                    });
                    sidebar.show();
                }
            }
        }
        let scrollableList = new ScrollableList(container, "logDetails", data, listArgs, callback);
        plr.hide();
    }
});
