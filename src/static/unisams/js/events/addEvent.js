$(function() {
    $(document).ready (function () {
        //setupTimePickerWidget()
        $("#eventinp-date").val(new Date().toDateInputValue())
        // $("#eventinp-timeStart").val(new Date().toDateInputValue())
        // $("#eventinp-timeEnd").val(new Date().toDateInputValue())

       // window.addEventListener("resize", setupTimePickerWidget);
    });

    $('#addEventFormSubmit').on("click", function(event) {
        event.preventDefault(); // Stops browser from navigating away from page
        const regex = / Uhr/g;
        var data = {
            title:   $('#eventinp-title').val(),
            type:   $('#eventinp-type').val(),
            date:  $('#eventinp-date').val(),
            startTime:  $('#eventinp-timeStart').val().replace(regex, ""),
            endTime:  $('#eventinp-timeEnd').val().replace(regex, ""),
            shortDesc:   $('#eventinp-shortDesc').val(),
            longDesc:   $('#eventinp-longDesc').val(),
        };
        actions.addEvent(data);
    });

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
            })
            let options = {
                title: 'Zeit auswählen',
                twentyFour: true,
            }
            inputs.wickedpicker(options);
        }
    }
    Date.prototype.toDateInputValue = (function() {
        var local = new Date(this);
        local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
        return local.toJSON().slice(0,10);
    });



});