import "../sidebar-events.scss";

import {HandlerFunctionResult} from "../Sidebar"
import SidebarPlugin from "../SidebarPlugin"
import ContentHandler from "../ContentHandler";
import SidebarButton from "../SidebarButton";
import SidebarTooltip from "../SidebarTooltip";

import {Searchbar} from "../../searchbar/searchbar.js";

import Handlebars from "handlebars";
import "../../helpers/handlebarsHelpers";

const plugin = new SidebarPlugin("calendar");

let viewDate = new ContentHandler("viewDate",
    async function(sidebar, args: {startDate: Date, endDate: Date}, type): Promise<HandlerFunctionResult>
    {
        const startDate = args.startDate;
        const endDate = args.endDate;

        let context = {
            startDate,
            endDate,
        }
        $.get('/webpack/sidebar/templates/calendar/sidebar-viewDate.hbs', function (data) {
            let template = Handlebars.compile(data);
            sidebar.setHTMLContent(template(context));
            sidebar.registerBackButton( ".sidebar-back-btn");

            sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        let url = "/events/create";
                        if(startDate)  {
                            const startDateUrlString = startDate
                            const endDateUrlString = endDate
                            url = url+"?startDate="+startDateUrlString;
                            if(endDate)  {
                                url = url+"?endDate="+endDateUrlString;
                            }
                        }
                        window.location.href=url;
                    }.bind(args)
                });

        });

        return {
            errors: []
        }
    });

plugin.addContentHandler(viewDate);
export default plugin;

