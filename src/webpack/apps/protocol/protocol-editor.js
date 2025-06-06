import "./protocol-editor.scss"
import "./layout/divi.scss"
import "./layout/general.scss"

import Snackbar from "../../helpers/snackbar";
import {Navigation} from "../app_navigation"


$(document).ready (function () {
    let protocol = window.currentExploredProtocol;
    if (!protocol.content) {
        protocol.content = {}
    }

    let nav = new Navigation({
        pageData: {
            title: protocol.title,
            name: "Divi Protokoll Online"
        },
        data: protocol
    }, window.version);

    //choose protocol template
    let template="divi";
    let url;
    switch(template){
        case "divi":
            url="/webpack/apps/protocol/templates/divi.hbs";
            break;
        default:
            url="/webpack/apps/protocol/templates/divi.hbs";
            break;
    }

    //render template
    $.get(url, function (data) {
        var template = Handlebars.compile(data);
        let content = template(protocol);
        let protocolContainer = document.getElementById("protocol-container");
        protocolContainer.innerHTML = content;

        //call document specific functions

        divi();
    });


    function divi(){
        let navinit = nav.initialize;
        navinit.done(function(){
            $(".app-link-page1").on("click", function(){
                displayPage(1);
            });
            $(".app-link-page2").on("click",function() {
                displayPage(2);
            });
            $(".app-link-save").on("click",function() {
                saveDivi()
            });
            initializeFieldIds();
        })
        displayPage(1);
        $(".selectable").on("click", function(){
            this.classList.toggle("selected");
        })
        $(".selectable-scale-item").on("click", function(){
            let for_id = this.dataset.for;
            let valElement = document.getElementById(for_id);
            if (this.classList.contains("selected")){
                this.classList.remove("selected");
                valElement.value = 0;
            }
            else {
                $(".selectable-scale-item").each(function(){
                    this.classList.remove("selected")
                })
                this.classList.add("selected");
                valElement.value = this.dataset.value;
            }
        })
        $('input[type=radio]').on("mousedown", function(e){
            if($(this).prop("checked")) {
               this.addEventListener("click", function(e){
                   $(e.target).prop("checked", false);
               }, {once : true})
            }
        })

        $(".date-input-container input").focus(function(){
            //find next
            let next = $(this).parent().next().find("input:first-of-type");
            $(this).keyup(function(e){
                var code = e.keyCode || e.which;
                if (code == '9'|| code == '8') return;
                next.focus();
            })
        })
        $(".continuetosibling").keyup(function(){
            //find next
            $(this).nextAll("input").first().focus();
        })

        function displayPage(page) {
            //find associated page container
            $(".divi-page").removeClass("active")
            $(".divi-page.page"+page).addClass("active");
        }

        function initializeFieldIds(){
            //find all inputs and give them unique identifiers
            let uniqueCounter = 0;
            $("input").each(function(){
                uniqueCounter++;
                this.dataset.fieldid = uniqueCounter;
                //load data, if available
                let val = protocol.content[uniqueCounter]
                if (val !== undefined){
                    switch (this.type){
                        case "text":
                            this.value = val;
                            break;
                        case "radio":
                            this.checked = val;
                            break;
                        case "checkbox":
                            this.checked = val;
                            break;
                    }
                }
            })
        }
    }

    function saveDivi() {
        let content = {}
        //find all input fields
        $("input").each(function(){
            let uniqueFieldId = this.dataset.fieldid;
            let value;
            switch (this.type){
                case "text":
                    value = this.value;
                    break;
                case "radio":
                    value = this.checked;
                    break;
                case "checkbox":
                    value = this.checked;
                    break;
            }
            content[uniqueFieldId] = value;
        });
        console.log(content);

        //api call to save content
        $.ajax({
            url: "/api/v1/apps/protocol/" + window.user.id + "/docs/" + protocol.id,
            type: 'POST',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(content),
            success: function(result) {
                alert("protocol saved");
            }
        });

    }

});
