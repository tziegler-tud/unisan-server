var lidlRTO = window.lidlRTO;

$(document).ready (function () {


    var sidebar = new common.Sidebar('wrapper', {title: "Test"});

    // hook user entries to sidebar.

    $('.event-entry').each(function(){
        $(this).on("click", function(e){
            e.preventDefault();
            window.location = "/unisams/events/" + this.dataset.eventid;
        })
    });

    $('.radio-item').checkboxradio({
        icon: false
    });
    $('#userlist02').checkboxradio({
        disabled: true
    });




});