var lidlRTO = window.lidlRTO;

import {Preloader} from "../helpers/preloader"
import {ScrollableList} from "../scrollableList/scrollableList";

import {Sidebar} from "../sidebar/sidebar";
import {logPlugin} from "../sidebar/plugins/plugin-logs";


let logs = {
    init: function() {
        $(document).ready(function () {
            let plr  = new Preloader();
            plr.show();

            //debug line, remove before flight
            console.log("loading js module: system.logs");

            // window.DockerElement = new docker.Docker(window.dockerArgs);
            var sidebar = new Sidebar('wrapper', {title: "Test"});
            sidebar.addPlugin(logPlugin);

            //get logs
            $.ajax({
                url: "/api/v1/logs/get",
                type: 'GET',
                contentType: "application/json; charset=UTF-8",
                success: function (result) {
                    let container = document.getElementById('loglist-container');
                    let args = {
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
                                let logObj = result.find(function (el) {
                                    return el.id === self.dataset.logid;
                                })
                                sidebar.addContent("logDetails", {
                                    log: logObj
                                });
                                sidebar.show();
                            }
                        }
                    }
                    let scrollableList = new ScrollableList(container, "logDetails", result, args, callback);
                    plr.hide();
                }
            });
        });
    }
}

export {logs}

