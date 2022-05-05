import {Sidebar, SidebarPlugin, ContentHandler, SidebarButton} from "../sidebar.js";


const Handlebars = require("handlebars");
import "../../helpers/handlebarsHelpers";

let logPlugin = new SidebarPlugin("log");

let showLogDetails = new ContentHandler("logDetails",
    function(sidebar, args, type){
        let log = args.log;
        let handleData = {
            log: log,
        }
        $.get('/webpack/sidebar/templates/log/sidebar-viewLogEntry.hbs', function (data) {
            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(handleData));
            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerButton(".sidebar-delete", function(){
                // delete log entry
                $.ajax({
                    url: "/api/v1/logs/" + log.id,
                    type: 'DELETE',
                    contentType: "application/json; charset=UTF-8",
                    success: function(result) {
                        window.location.reload();
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        // alert(textStatus + ": " + XMLHttpRequest.status + " " + errorThrown);
                        if (XMLHttpRequest.status===403) self.addErrorMessage("Operation not permitted.", function(data){
                            $("#sidebar-inner").before(data);
                        }, true);
                    }
                });
            });
        });
    });

logPlugin.addContentHandler(showLogDetails);

//TODO: make Sidebar a singleton and add static function to access runtime object

export {logPlugin}