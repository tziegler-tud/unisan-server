import {MDCTextField} from '@material/textfield';
import {MDCTextFieldHelperText} from '@material/textfield/helper-text';
import {MDCTextFieldIcon} from '@material/textfield/icon';

import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {eventPlugin} from "../sidebar/plugins/plugin-event";

import {EditableTextField} from "../helpers/editableTextField";
import EditableInputField from "../helpers/editableInputField";

import {lidl} from "/lib/lidl-modules/core/lidlModular-0.2"
import {Observer as lidlObserver} from "/lib/lidl-modules/observer/lidl-observer"
import {Dialog as lidlDialog} from "/lib/lidl-modules/dialog/lidl-dialog"
import PageSlider from "../../lib/lidl-modules/pageSlider/pageSlider";

const Handlebars = require("handlebars");

import {eventActions} from "../actions/eventActions";


$(document).ready (function () {
    var lidlRTO = window.lidlRTO;
    //setupTimePickerWidget()
    $("#eventinp-date").val(new Date().toDateInputValue())
    // $("#eventinp-timeStart").val(new Date().toDateInputValue())
    // $("#eventinp-timeEnd").val(new Date().toDateInputValue())

    // window.addEventListener("resize", setupTimePickerWidget);
    let pagesliderContainer = document.getElementById("pageslider-container-01");
    $.get('/webpack/events/templates/addEvent-container.hbs', function (data) {
        var template = Handlebars.compile(data);
        pagesliderContainer.innerHTML = template();
        buildPageSlider(pagesliderContainer);
    });

});


function buildPageSlider(container) {
    const handleData = {
        userAgent: {
            locale: Intl.DateTimeFormat().resolvedOptions(),
        }
    }
    let token = lidlRTO.objectManager.createNewObjectToken();
    let pageslider = new PageSlider(container, token);
    pageslider.setCallback({
        onComplete: function(data){
            const regex = / Uhr/g;
            var apiData = {
                title:   data[1].title,
                type:   data[1].type,
                date:  data[2].date,
                startTime:  data[2].timeStart.replace(regex, ""),
                endTime:  data[2].timeEnd.replace(regex, ""),
                location:  data[2].location,
                shortDescVal:   data[3].shortDescVal,
                shortDescDelta:   data[3].shortDescDelta,
                longDescVal:   data[3].longDescVal,
                longDescDelta:   data[3].longDescDelta,
            };
            eventActions.addEvent(apiData);
        },
        onError: function(){

        }
    })

    //get first page
    $.get('/webpack/events/templates/addEvent-general.hbs', function (data) {
        var template = Handlebars.compile(data);
        let page1 = pageslider.addPage(template(handleData));

        //get second page
        $.get('/webpack/events/templates/addEvent-dateLocation.hbs', function (data) {
            var template = Handlebars.compile(data);
            let page2 = pageslider.addPage(template(handleData));

            //get third page
            $.get('/webpack/events/templates/addEvent-description.hbs', function (data) {
                var template = Handlebars.compile(data);
                let page3 = pageslider.addPage(template(handleData));

                var editableTextFieldContainer = document.getElementById("eventitem-longdesc");
                var longDescInput = new EditableTextField(editableTextFieldContainer, {}, "", {}, {active: true, disableButtons: true});
                page3.setOnSaveCallback(function(){
                    page3.addObject("longDescDelta", longDescInput.getQuill().getContents())
                    page3.addObject("longDescVal", longDescInput.getQuill().getText());
                })

                //input elements
                pageslider.addClassToLabel("test");
                const textFields = [].map.call(document.querySelectorAll('.mdc-text-field'), function(el) {
                    return new MDCTextField(el);
                });
                const helperFields = [].map.call(document.querySelectorAll('.mdc-text-field-helper-text'), function(el) {
                    return new MDCTextFieldHelperText(el);
                });
                const icon = new MDCTextFieldIcon(document.querySelector('.mdc-text-field-icon'));

            });
        });
    });
}

var setupTimePickerWidget = function(){
    //only if not on mobile
    const inputs = $(".timepicker");
    var phone = window.matchMedia("only screen and (max-width: 50em)");
    if(phone.matches){
        inputs.each(function(el){
            console.log("hiding picker");
            this.type = "time";
        })
    }
    else {
        inputs.each(function(el){
            this.type = "text";
        });
        let options = {
            title: 'Zeit auswählen',
            twentyFour: true,
        };
        inputs.wickedpicker(options);
    }
};

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});
