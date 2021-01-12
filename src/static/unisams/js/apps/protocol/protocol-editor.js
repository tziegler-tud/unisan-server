var lidlRTO = window.lidlRTO;
var app = window.app;

$(document).ready (function () {
    let protocol = window.currentExploredProtocol;
    // let drawer = new app.Drawer({});
    // let topbar = new app.Topbar({
    //     pageData: {
    //         title: document.title,
    //     },
    //     data: document
    // });

    let nav = new app.Navigation({
        pageData: {
            title: protocol.title,
        },
        data: protocol
    });

    //choose protocol template
    let template="divi";
    let url;
    switch(template){
        case "divi":
            url="/static/unisams/js/apps/protocol/templates/divi.hbs";
            break;
        default:
            url="/static/unisams/js/apps/protocol/templates/divi.hbs";
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
        $(".selectable").on("click", function(){
            this.classList.toggle("selected");
        })
        $(".selectable-scale-item").on("click", function(){
            let valElement = document.getElementById("divi--erstbefunde2-schmerze-input");
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
    }

});
