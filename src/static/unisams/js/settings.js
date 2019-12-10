var lidlRTO = window.lidlRTO;

$(document).ready (function () {


    sidebar = new common.Sidebar('wrapper', {title: "Test"});

    // hook qual entries to sidebar.

    $('.quallist-entry').each(function(){
        $(this).on("click", function(e){
            e.preventDefault();
            sidebar.addContent("QualificationUpdate", {
                qualificationId: this.dataset.qualid,
                callback: {
                    onConfirm: function(qualId, data){
                        // build a json object or do something with the form, store in data
                        $.ajax({
                            url: '/unisams/qualification/'+qualId,
                            type: 'PUT',
                            dataType: 'json',
                            data: data,
                            success: function(result) {
                                window.location.reload();

                            }
                        });
                    }
                }
            });
            sidebar.show();
        })
    });

    const token = lidlRTO.objectManager.createNewObjectToken();
    var btn = new lidl.Button(token, $("#addQualButton"), {
        enabled: true,
    });
    lidlRTO.objectManager.addObject(btn, token);
    btn.addAction("click",function(){
        sidebar.addContent("QualificationCreate", {
            callback: {
                onConfirm: function(qualId, data){
                    // build a json object or do something with the form, store in data
                    $.post('/unisams/qualification/create', data, function(resp) {
                        location.replace("/unisams/settings")
                        // do something when it was successful
                    });
                }
            }
        });
        sidebar.show();
    });




});