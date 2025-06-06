import ScrollableList from "../scrollableList/ScrollableList";
import Sidebar from "../sidebar/Sidebar";
import {qualificationPlugin} from "../sidebar/plugins/plugin-qualifications.js";
import {escapeSelector} from "../helpers/helpers";
import {Preloader} from "../helpers/preloader"
import qualificationActions from "../actions/qualificationActions";
import {Dialog as LidlDialog} from "/lib/lidl-modules/dialog/lidl-dialog";
import PageModule from "../utils/PageModule";



export default new PageModule({
    title: "system.qualifications",
    pageData: {},
    init: async () => {

        let plr  = new Preloader();
        plr.show();

        //debug line, remove before flight
        console.log("loading js module: system.qualifications");

        var lidlRTO = window.lidlRTO;

        //get qualifications
        const result = await new Promise((resolve, rejecT) => {
            $.ajax({
                url: "/api/v1/qualification/groupByType",
                type: 'GET',
                contentType: "application/json; charset=UTF-8",
            })
                .done(result => {
                    resolve (result)
                })
                .fail(err => {
                    reject(err);
                })
        });
        return {args: {plr: plr}, data: result};

    },
    buildPage: async function({args={}, data={}}={}) {
        const plr = args.plr;
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

        let container = document.getElementById('quallist-container');
        let listArgs = {
            height: "10em",
            sorting: {
                property: "level",
                direction: 1,
            }
        }

        data.sort(function(a,b){
            if (a._id < b._id) return -1;
            if (a._id > b._id) return 1;
            return 0;
        })
        let callback = {
            listItem: {
                onClick: function (e) {
                    e.preventDefault();
                    sidebar.addContent("updateQualification", {
                        qualificationId: e.currentTarget.dataset.qualid,
                        callback: {
                            onConfirm: (qualId, data) => {
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
                                    onConfirm: (res) => {
                                        qualificationActions.removeQualification(key, value, args,function(){
                                            $("#qualId" + escapeSelector(qualId)).remove();
                                            sidebar.showDefault();
                                        });
                                        lidlRTO.objectManager.removeObject(dialog_token);
                                    }
                                }
                                const dialog = new LidlDialog(dialog_token, null, 'removeDBKey', dialog_content, dialog_args, cb);
                                lidlRTO.objectManager.addObject(dialog, dialog_token);
                                dialog.openDialog();
                            }
                        }
                    });
                    sidebar.show();
                }
            }
        }
        data.forEach(qualType => {
            let listData = qualType.values;
            let subContainer = document.createElement("div");
            container.append(subContainer);
            let scrollArgs = {
                hasTitle: true,
                title: qualType._id,
            }
            scrollArgs = Object.assign(listArgs, scrollArgs);
            let scrollableList = new ScrollableList(subContainer, "qualification", listData, scrollArgs, callback)
        });
        plr?.hide();
    }
});
