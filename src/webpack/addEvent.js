import {MDCTextField} from '@material/textfield';
import {MDCTextFieldHelperText} from '@material/textfield/helper-text';
import {MDCTextFieldIcon} from '@material/textfield/icon';


var common = window.common;
var actions = window.actions;


$(document).ready (function () {
    //setupTimePickerWidget()
    $("#eventinp-date").val(new Date().toDateInputValue())
    // $("#eventinp-timeStart").val(new Date().toDateInputValue())
    // $("#eventinp-timeEnd").val(new Date().toDateInputValue())

    // window.addEventListener("resize", setupTimePickerWidget);

    let pagesliderContainer = document.getElementById("pageslider-container-01");
    $.get('/static/unisams/js/events/templates/addEvent-container.hbs', function (data) {
        var template = Handlebars.compile(data);
        pagesliderContainer.innerHTML = template();
        buildPageSlider(pagesliderContainer);
    });

});


function buildPageSlider(container) {
    let token = lidlRTO.objectManager.createNewObjectToken();
    let pageslider = new lidl.PageSlider(container, token);
    pageslider.setCallback({
        onComplete: function(data){
            const regex = / Uhr/g;
            var apiData = {
                title:   data[1].title,
                type:   data[1].type,
                date:  data[2].date,
                startTime:  data[2].timeStart.replace(regex, ""),
                endTime:  data[2].timeStart.replace(regex, ""),
                location:  data[2].location,
                shortDescVal:   data[3].shortDescVal,
                shortDescDelta:   data[3].shortDescDelta,
                longDescVal:   data[3].longDescVal,
                longDescDelta:   data[3].longDescDelta,
            };
            actions.events.addEvent(apiData);
        },
        onError: function(){

        }
    })

    //get first page
    $.get('/static/unisams/js/events/templates/webpack/addEvent-general.hbs', function (data) {
        var template = Handlebars.compile(data);
        let page1 = pageslider.addPage(template());

        //get second page
        $.get('/static/unisams/js/events/templates/webpack/addEvent-dateLocation.hbs', function (data) {
            var template = Handlebars.compile(data);
            let page2 = pageslider.addPage(template());

            //get third page
            $.get('/static/unisams/js/events/templates/webpack/addEvent-description.hbs', function (data) {
                var template = Handlebars.compile(data);
                let page3 = pageslider.addPage(template());

                var editableTextFieldContainer = document.getElementById("eventitem-longdesc");
                var longDescInput = new common.EditableTextField(editableTextFieldContainer, {}, "", {}, {active: true, disableButtons: true});
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
