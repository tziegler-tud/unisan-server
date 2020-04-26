var lidlRTO = window.lidlRTO;
var common = window.common;
var actions = window.qualificationActions;

$(document).ready (function () {


    var sidebar = new common.Sidebar('wrapper', {title: "Test"});

    // hook qual entries to sidebar.

    $('.quallist-entry').each(function(){
        $(this).on("click", function(e){
            e.preventDefault();
            sidebar.addContent("QualificationUpdate", {
                qualificationId: this.dataset.qualid,
                callback: {
                    onConfirm: function(qualId, data){
                        const keyIdentifier = qualId;
                        const value = data;
                        const args = {};
                        actions.updateDBKey(keyIdentifier, value, args, function(){
                            window.location.reload();
                        })
                    },
                    onDelete: function(qualId, data){
                        const key = qualId;
                        const value = data;
                        var args = {
                            isArray: true
                        };

                        const dialog_content = {
                            title: "Qualifikation löschen",
                            message: "Folgende Qualifikation wird gelöscht: " + value.name,
                            titleArg: "",
                            messageArg: ""
                        };
                        var dialog_token = lidlRTO.objectManager.createNewObjectToken();
                        const dialog_args = {
                            callback: {
                                onConfirm: function(res){
                                    actions.removeDBKey(key, value, args,function(){
                                        $("#qualId" + common.escapeSelector(qualId)).remove();
                                    });
                                    lidlRTO.objectManager.removeObject(dialog_token);
                                }
                            }
                        };
                        const dialog = new lidl.Dialog(dialog_token, null, 'removeDBKey', dialog_content, dialog_args);
                        lidlRTO.objectManager.addObject(dialog, dialog_token);
                        dialog.openDialog();

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
                    const keyIdentifier = qualId;
                    const value = data;
                    const args = {};
                    actions.insertDBKey(keyIdentifier, value, args, function(){
                        window.location.reload();
                    })
                }
            }
        });
        sidebar.show();
    });




});