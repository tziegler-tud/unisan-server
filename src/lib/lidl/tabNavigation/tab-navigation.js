/**
 *
 * lidl tab navigation
 *
 * switch between content pages by tabular navigation
 *
 *
 * @author: Tom Ziegler
 * @version: 0.1b
 *
 *
 * @namespace lidl
 *
 */

(function (lidl,$,undefined) {

    lidl.TabNavigation = function(containerId, token){
        this.container = $("#"+containerId);
        this.token = token;

        this.tabs = [];


        this.container.addClass("tabnav-container");
    };

    lidl.TabNavigation.prototype.addTab = function(tabContentHtml, targetSelector){
        let self = this;
        var tab = $("<div/>", {
            "class": "tabnav-tab",
            "id": "tabnav-" + self.token + "-" + self.tabs.length + 1,
            "html": tabContentHtml
        })
    };


    return lidl.TabNavigation;



}(lidl = window.lidl || {}, jQuery));