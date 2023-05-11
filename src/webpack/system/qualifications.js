
import {ScrollableList} from "../scrollableList/scrollableList";

import {Sidebar} from "../sidebar/sidebar";
import {qualificationPlugin} from "../sidebar/plugins/plugin-qualifications.js";

import {escapeSelector} from "../helpers/helpers";
import {Preloader} from "../helpers/preloader"

import {actions, qualificationActions} from "../actions/actions";
import {lidl} from "/lib/lidl-modules/core/lidlModular-0.2";
import {Dialog as lidlDialog} from "/lib/lidl-modules/dialog/lidl-dialog";


let qualifications = {
    init: function() {
        $(document).ready(function () {
            let plr  = new Preloader();
            plr.show();

            //debug line, remove before flight
            console.log("loading js module: system.qualifications");

            var lidlRTO = window.lidlRTO;

            // window.DockerElement = new docker.Docker(window.dockerArgs);
            var sidebar = new Sidebar('wrapper', {title: "Test"});
            sidebar.addPlugin(qualificationPlugin);

            $(".addQualificationButton").on("click", function (e) {
                e.preventDefault();
                sidebar.addContent('addQualification', {
                        callback: {
                            onConfirm: function (data) {
                                qualificationActions.addQualification(data, {}, function(){
                                    window.location.reload();
                                });
                            }
                        }
                    },
                );
                sidebar.show();
            });

            //get qualifications
            $.ajax({
                url: "/api/v1/qualification/groupByType",
                type: 'GET',
                contentType: "application/json; charset=UTF-8",
                success: function (result) {
                    let container = document.getElementById('quallist-container');
                    let args = {
                        height: "10em",
                        sorting: {
                            property: "level",
                            direction: 1,
                        }
                    }
                    result.sort(function(a,b){
                        if (a._id < b._id) return -1;
                        if (a._id > b._id) return 1;
                        return 0;
                    })
                    let callback = {
                        listItem: {
                            onClick: function (e) {
                                let self = e.currentTarget;
                                e.preventDefault();
                                sidebar.addContent("updateQualification", {
                                    qualificationId: self.dataset.qualid,
                                    callback: {
                                        onConfirm: function(qualId, data){
                                            const value = data;
                                            const args = {};
                                            qualificationActions.updateQualification(qualId, value, args, function(){
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


                                            };
                                            const cb = {
                                                onConfirm: function(res){
                                                    qualificationActions.removeQualification(key, value, args,function(){
                                                        $("#qualId" + escapeSelector(qualId)).remove();
                                                        sidebar.showDefault();
                                                    });
                                                    lidlRTO.objectManager.removeObject(dialog_token);
                                                }
                                            }
                                            const dialog = new lidlDialog(dialog_token, null, 'removeDBKey', dialog_content, dialog_args, cb);
                                            lidlRTO.objectManager.addObject(dialog, dialog_token);
                                            dialog.openDialog();
                                        }
                                    }
                                });
                                sidebar.show();
                            }
                        }
                    }
                    result.forEach(qualType => {
                        let listData = qualType.values;
                        let subContainer = document.createElement("div");
                        container.append(subContainer);
                        let scrollArgs = {
                            hasTitle: true,
                            title: qualType._id,
                        }
                        scrollArgs = Object.assign(args, scrollArgs);
                        let scrollableList = new ScrollableList(subContainer, "qualification", listData, scrollArgs, callback)
                    });
                    plr.hide();
                }
            });
        });
    }
}

export {qualifications}

