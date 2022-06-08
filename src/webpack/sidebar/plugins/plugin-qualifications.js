import {Sidebar, SidebarPlugin, ContentHandler, SidebarButton} from "../sidebar.js";


const Handlebars = require("handlebars");
import "../../helpers/handlebarsHelpers";

let qualificationPlugin = new SidebarPlugin("qualification");

var updateQualification = new ContentHandler("updateQualification",
    function(sidebar, args, type){

        var qualId = args.qualificationId;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        var res = {qualifications: {}};

        sidebar.getDataFromServer("/api/v1/qualification/groupByType", function(byTypeArray){
            res.qualifications.byType = byTypeArray;
            res.currentQualification = sidebar.findQualByIdInTypeArray(byTypeArray, qualId);
            action(res);

        });

        var action = function(context){
            let res = context;
            var opt = false;
            $.get('/webpack/sidebar/templates/qualifications/sidebar-updateQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                let handleData = context;
                sidebar.sidebarHTML.html(template(handleData));
                sidebar.registerBackButton(".sidebar-back-btn");
                sidebar.registerCancelButton(".sidebar-cancel");
                sidebar.registerConfirmButton(".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            data = {
                                id: qualId,
                                qualType: context.currentQualification.qualType, //immutable
                                name: $("#qual-name").val(),
                                short: $("#qual-short").val(),
                                level: $("#qual-level").val(),
                            };
                            onConfirm(qualId, data);
                        }.bind(args)
                    });
                sidebar.registerButton(".sidebar-delete",
                    {
                        customHandler: true,
                        handler: function () {
                            // delete array entry
                            data = res.currentQualification;
                            onDelete(qualId, data);
                        }
                    });

                // populate selects with current content as default


            });
        };
    });

var addQualification = new ContentHandler("addQualification",
    function(sidebar, args, type){

        var onConfirm = args.callback.onConfirm;

        var res = {qualifications: {}};

        sidebar.getDataFromServer("/api/v1/qualification/groupByType", function(context){
            res.qualifications.byType = context;
            action(res);

        });

        var action = function(context){
            var opt = false;
            $.get('/webpack/sidebar/templates/qualifications/sidebar-createQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                sidebar.sidebarHTML.html(template(context));
                sidebar.registerBackButton(".sidebar-back-btn");
                sidebar.registerCancelButton(".sidebar-cancel");
                sidebar.registerConfirmButton(".sidebar-confirm",
                    {
                        customHandler: true,
                        handler: function () {
                            data = {
                                name:  $("#qual-name").val(),
                                short: $("#qual-short").val(),
                                level: $("#qual-level").val(),
                            };
                            if(opt) {
                                data.qualType = $("#custom-type").val();
                            }
                            else {
                                data.qualType = $("#qual-type").val();
                            }
                            onConfirm(data);
                        }.bind(args)
                    });
                $("#qual-type").on("change",function(e) {
                    if (e.target.value === "enableOptional_custom-type"){
                        sidebar.enableOptional(".ak-customType");
                        opt = true;
                    }
                    else {
                        sidebar.disableOptional(".ak-customType");
                        opt = false;
                    }
                });
            });
        };
    });

qualificationPlugin.addContentHandler(updateQualification);
qualificationPlugin.addContentHandler(addQualification);

//TODO: make Sidebar a singleton and add static function to access runtime object

export {qualificationPlugin}