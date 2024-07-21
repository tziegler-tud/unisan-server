import SidebarPlugin from "../SidebarPlugin"
import ContentHandler from "../ContentHandler";

import {MDCSwitch} from '@material/switch';
import "./plugin-system.scss";

const Handlebars = require("handlebars");
import "../../helpers/handlebarsHelpers";
import {getDataFromServer} from "../../helpers/helpers";

let systemPlugin = new SidebarPlugin("system");


let editMailSettings = new ContentHandler("mailSettings",
    (sidebar, args, type) => {
        var onConfirm = args.callback.onConfirm;
        let context = {
            url: args.data.url,
            port: args.data.port,
            baseUrl: args.data.baseUrl,
            apiKey: args.data.apiKey,
            domain: args.data.domain,
        }
        $.get('/webpack/sidebar/templates/system/sidebar-mailSettings.hbs', function (data) {
            let template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {

                        const url = document.getElementById("sidebar-input-mail--url").value;
                        const port = document.getElementById("sidebar-input-mail--port").value;
                        const baseUrl = document.getElementById("sidebar-input-mail--baseUrl").value;
                        const apiKey = document.getElementById("sidebar-input-mail--apikey").value;
                        const domain = document.getElementById("sidebar-input-mail--domain").value;

                        const data = {
                            url: url,
                            port: port,
                            baseUrl: baseUrl,
                            apiKey: apiKey,
                            domain: domain,
                        };
                        onConfirm(data, {});
                    }.bind(args)
                });
        });
    });

let editOidcSettings = new ContentHandler("openIdSettings",
    function(sidebar, args, type) {

        var onConfirm = args.callback.onConfirm;

        let context = {
            issuer: args.data.issuer,
            port: args.data.port,
            title: args.title,
        }
        $.get('/webpack/sidebar/templates/system/sidebar-openIdSettings.hbs', function (data) {
            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {

                        const issuer = document.getElementById("sidebar-input-openId--issuer").value;
                        const port = document.getElementById("sidebar-input-openId--port").value;

                        const data = {
                            issuer: issuer,
                            port: port,
                        };
                        onConfirm(data, {});
                    }.bind(args)
                });
        });
    });

let editOidcSettingsAdvanced = new ContentHandler("openIdSettingsAdvanced",
    function(sidebar, args, type) {

        var onConfirm = args.callback.onConfirm;
        let cookieSecrets = "";
        if (args.data.cookieSecrets){
           cookieSecrets = args.data.cookieSecrets.toString();
        }

        let context = {
            cookieSecrets: cookieSecrets,
            title: args.title,
        }
        $.get('/webpack/sidebar/templates/system/sidebar-openIdSettingsAdvanced.hbs', function (data) {
            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        const cookieSecrets = document.getElementById("sidebar-input-openId--cookieSecrets").value;
                        const data = {
                            cookieSecrets: arrayFromString(cookieSecrets),
                        };
                        onConfirm(data, {});
                    }.bind(args)
                });
        });
        function arrayFromString(string){
            return string.split(",")
        }
    });

let updateOidcClient = new ContentHandler("updateOidcClient",
    function(sidebar, args, type) {

        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        let context = {
            data: args.data.client,
            title: args.title,
        }
        $.get('/webpack/sidebar/templates/system/sidebar-openIdClient.hbs', function (data) {
            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");
            sidebar.registerDeleteButton(".sidebar-delete", {
                customHandler: true,
                handler: function () {
                    onDelete(args.data.client._id, args.data.client);
                }.bind(args)
            })

            const name = document.getElementById("sidebar-input-openIdClient--name")
            const client_id = document.getElementById("sidebar-input-openIdClient--clientId")
            let redirect_uris = []
            let post_logout_redirect_uris = []
            const enabledSwitch = new MDCSwitch(document.getElementById("sidebar-input-openIdClient-enabled__switch"))
            enabledSwitch.selected = args.data.client.enabled;

            sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        sidebar.container.querySelectorAll(".openIdClient-redirectUris").forEach(element => {
                            if(element.value.length > 0) redirect_uris.push(element.value);
                        })
                        sidebar.container.querySelectorAll(".openIdClient-postLogoutRedirectUris").forEach(element => {
                            if(element.value.length > 0) post_logout_redirect_uris.push(element.value);
                        })
                        const data = {
                            name: name.value,
                            client_id: client_id.value,
                            redirect_uris: redirect_uris,
                            post_logout_redirect_uris: post_logout_redirect_uris,
                            enabled: enabledSwitch.selected,
                        };
                        onConfirm(args.data.client._id, data);
                    }.bind(args)
                });
        });
    });


let addOidcClient = new ContentHandler("addOidcClient",
    function(sidebar, args, type) {

        var onConfirm = args.callback.onConfirm;

        let context = {
            data: args.data.client,
            title: args.title,
        }
        $.get('/webpack/sidebar/templates/system/sidebar-openIdClientAdd.hbs', function (data) {
            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");

            const name = document.getElementById("sidebar-input-openIdClient--name")
            const client_id = document.getElementById("sidebar-input-openIdClient--clientId")
            let redirect_uris = []
            let post_logout_redirect_uris = []
            sidebar.container.querySelectorAll(".openIdClient-redirectUris").forEach(element => {
                if(element.value.length > 0) redirect_uris.push(element.value);
            })
            sidebar.container.querySelectorAll(".openIdClient-redirectUris").forEach(element => {
                if(element.value.length > 0) post_logout_redirect_uris.push(element.value);
            })
            const enabledSwitch = new MDCSwitch(document.getElementById("sidebar-input-openIdClient-enabled__switch"))
            enabledSwitch.selected = args.data.client.enabled;

            sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        const data = {
                            name: name.value,
                            client_id: client_id.value,
                            redirect_uris: redirect_uris,
                            post_logout_redirect_uris: post_logout_redirect_uris,
                            enabled: enabledSwitch.selected,
                        };
                        onConfirm(data);
                    }.bind(args)
                });
        });
    });



let setMemberIdAssignment = new ContentHandler("setMemberIdAssignment",
    function(sidebar, args, type) {

        var onConfirm = args.callback.onConfirm;

        let context = {
            data: {
                modeOptions: args.data.modeOptions,
                offset: args.data.offset,
                mode: args.data.mode,
            },
            title: args.title,
        }
        $.get('/webpack/sidebar/templates/system/sidebar-setMemberIdAssignment.hbs', function (data) {
            var template = Handlebars.compile(data);
            sidebar.sidebarHTML.html(template(context));
            sidebar.registerBackButton(".sidebar-back-btn");
            sidebar.registerCancelButton(".sidebar-cancel");

            const mode = document.getElementById("sidebar-select-memberId--mode")
            const offset = document.getElementById("sidebar-input-memberId--offset")

            mode.value = args.data.mode;

            sidebar.registerConfirmButton( ".sidebar-confirm",
                {
                    customHandler: true,
                    handler: function () {
                        const data = {
                            mode: mode.value,
                            offset: offset.value
                        };
                        onConfirm(data, {});
                    }.bind(args)
                });
        });
    });


systemPlugin.addContentHandler(editMailSettings);
systemPlugin.addContentHandler(editOidcSettings);
systemPlugin.addContentHandler(editOidcSettingsAdvanced);
systemPlugin.addContentHandler(updateOidcClient);
systemPlugin.addContentHandler(addOidcClient);
systemPlugin.addContentHandler(setMemberIdAssignment);

/**
 *
 * @param field
 * @param dataset
 * @returns {Object}
 */
var checkDataValidity = function(field, dataset){
    var errorList = [];
    var status = 0;
    for (let [key, value] of Object.entries(dataset)){
        if(typeof(field[key])!==value){
            status = 1;
            errorList.push(key);
        }
    }
    if (errorList.length > 0) {
        var msg = "Failed to read data: " + errorList;
        return [status, msg];
    }
    return [status, ""];
};


/**
 * applies 'viewBox-disabled' class to the given elements
 * @param elements an HTML Element or an array containing HTML Elements
 */
var disableViewBox = function(elements) {
    var func = function(el) {
        el.disabled = true;
        el.classList.add("viewBox-disabled");
    };
    if(Array.isArray(elements)){
        elements.forEach(el=>func(el))
    }
    else func(elements)
};

export {systemPlugin}