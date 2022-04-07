var lidlRTO = window.lidlRTO;
var common = window.common;
var actions = window.actions;

let logs = {
    init: function() {
        $(document).ready(function () {

            //debug line, remove before flight
            console.log("loading js module: settings.logs");

            // window.DockerElement = new docker.Docker(window.dockerArgs);
            var sidebar = new common.Sidebar('wrapper', {title: "Test"});

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
                    let scrollableList = new common.ScrollableList(container, "logDetails", result, args, callback)
                }
            });
        });
    }
}

export {logs}

