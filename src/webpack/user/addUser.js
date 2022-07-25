import {MDCTextField} from '@material/textfield';
import {MDCTextFieldHelperText} from '@material/textfield/helper-text';
import {MDCTextFieldIcon} from '@material/textfield/icon';

import {Sidebar, SidebarPlugin, ContentHandler} from "../sidebar/sidebar.js";
import {userPlugin} from "../sidebar/plugins/plugin-user";

import {lidl} from "/src/lib/lidl-modules/core/lidlModular-0.2"
import {PageSlider as lidlPageSlider} from "/src/lib/lidl-modules/pageSlider/pageSlider";


import {userActions} from "../actions/userActions";
const Handlebars = require("handlebars");


$(document).ready (function () {
    //setupTimePickerWidget()
    var lidlRTO = window.lidlRTO;

    let pagesliderContainer = document.getElementById("pageslider-container-01");
    $.get('/webpack/user/templates/addUser/addUser-container.hbs', function (data) {
        var template = Handlebars.compile(data);
        pagesliderContainer.innerHTML = template();
        buildPageSlider(pagesliderContainer);
    });


});


function buildPageSlider(container) {
    let token = lidlRTO.objectManager.createNewObjectToken();
    let pageslider = new lidlPageSlider(container, token);
    pageslider.setCallback({
        onComplete: function(data){

            var apiData = {
                username:   data[1].username,
                generalData: {
                    firstName: data[1].firstname,
                    lastName: data[1].lastname,
                    memberId: data[3].memberid
                },
                password:  data[2].password,
            };
            let args = {
                memberId: {setCustom: false},
                userImg: {
                    tmp: true,
                    tmpkey: data[4].userimg_tmpkey,
                }
            };
            userActions.addUser(apiData, args);
        },
        onError: function(){

        }
    });

    //get first page
    $.get('/webpack/user/templates/addUser/addUser-general.hbs', function (data) {
        var template = Handlebars.compile(data);
        let page1 = pageslider.addPage(template());

        //get second page
        $.get('/webpack/user/templates/addUser/addUser-pw.hbs', function (data) {
            var template = Handlebars.compile(data);
            let page2 = pageslider.addPage(template());

            const pwField = new MDCTextField(document.querySelector('#password'));
            const pwCheck = new MDCTextField(document.querySelector('#passwordCheck'));
            const pwCheckHelper = new MDCTextFieldHelperText(document.querySelector('#passwordCheck-helper'));
            page2.addCustomValidator(function(){
                    /*
                    resons:
                        1 - pwds do not match
                        2 - pwcheck empty
                        2 - regex not passed
                     */
                    let result = {state: true, reason: 0}
                    let pw1 = document.getElementById("eventinp-password").value;
                    let pw2 = document.getElementById("eventinp-passwordCheck").value;
                    //entered pwds must match
                    if (pw1 !== pw2) {
                        result = {state: false, reason: 1}
                    }
                    if (pwCheck.value.length === 0) result = {state: false, reason: 2}
                    //pw must have 8 characters and min 1 number
                    let pwReg = new RegExp("^(((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})");
                    if (!pwReg.test(pw1))  result = {state: false, reason: 3};

                    return result;
                },
                {
                    onSuccess: function(){ return true},
                    onFailure: function(reason){
                        switch(reason){
                            case 1:
                                pwCheck.helperTextContent = "Passwörter stimmen nicht überein";
                                pwCheck.valid = false;
                                break;
                            case 2:
                                pwCheck.helperTextContent = "Passwort wiederholen";
                                pwCheck.valid = false;
                                break;
                            case 3:
                                pwField.helperTextContent = "Mindestens 8 Zeichen, davon mind. 1 Zahl und 1 Buchstabe";
                                pwCheck.helperTextContent = "Passwort wiederholen";
                                pwField.valid = false;
                                pwCheck.valid = false;
                                break;
                            default:
                                pwCheck.helperTextContent = "failed. Error" + reason;
                                pwCheck.valid = false;
                                break;
                        }
                    }
                });

            //get third page
            $.get('/webpack/user/templates/addUser/addUser-details.hbs', function (data) {
                var template = Handlebars.compile(data);
                let page3 = pageslider.addPage(template());

                //get 4th page
                $.get('/webpack/user/templates/addUser/addUser-img.hbs', function (data) {
                    var template = Handlebars.compile(data);
                    let page3 = pageslider.addPage(template());

                    var args2 = {
                        userid: "",
                        callback: {
                            onConfirm: function () {
                            }
                        }
                    };
                    const content2 = {
                        title: "Bild hochladen",
                    };

                    //input elements
                    pageslider.addClassToLabel("test");
                    // pageslider.addClassToInputs("mdc-input");
                    // const textFields = [].map.call(document.querySelectorAll('.mdc-input'), function(el) {


                    const textFields = [].map.call(document.querySelectorAll('.mdc-text-field-selector'), function(el) {
                        return new MDCTextField(el);
                    });

                    // const helperText = new MDCTextFieldHelperText(document.querySelector('.mdc-text-field-helper-text'));

                    const helperFields = [].map.call(document.querySelectorAll('.mdc-text-field-helper-text-selector'), function(el) {
                        return new MDCTextFieldHelperText(el);
                    });
                    // const icon = new MDCTextFieldIcon(document.querySelector('.mdc-text-field-icon'));


                    var token2 = lidlRTO.objectManager.createNewObjectToken();
                    const dialog02 = new lidl.Dialog(token2, ".imgUpload", 'imageUpload', content2, args2);
                    lidlRTO.objectManager.addObject(dialog02, token2);


                    var manualUploader = new qq.FineUploader({
                        element: document.getElementById('imgUpload-' + token2),
                        template: 'qq-template-manual-trigger',
                        request: {
                            method: 'POST',
                            endpoint: '/api/v1/usermod/tmp/uploadUserImage',
                            inputName: 'image'

                        },
                        thumbnails: {
                            placeholders: {
                                waitingPath: '/lib/fineUploader/placeholders/waiting-generic.png',
                                notAvailablePath: '/lib/fineUploader/placeholders/not_available-generic.png'
                            }
                        },
                        autoUpload: false,
                        debug: true,
                        multiple: false,

                        callbacks: {
                            onComplete: function (id, name, responseJSON) {
                                let tmpkey = responseJSON.tmpkey;
                                alert(tmpkey);
                                const items = $(".userProfileImage");
                                $(items).each(function () {
                                    const src = '/data/uploads/tmp/' + tmpkey + '.jpg';
                                    $(this).attr("src", src + "?t=" + new Date().getTime());
                                });
                                $("#userimg_tmpkey").val(tmpkey);
                                dialog02.confirmAndClose();
                            }
                        }
                    });
                    qq(document.getElementById("confirmBtn" + token2)).attach("click", function () {
                        manualUploader.uploadStoredFiles();
                    });
                });
            });

        });
    });
}