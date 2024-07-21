import "./userprofile.scss";
import "./addUser.scss";

import {MDCTextField} from '@material/textfield';
import {MDCTextFieldHelperText} from '@material/textfield/helper-text';
import {MDCList} from '@material/list';
import {MDCRipple} from '@material/ripple';

import PageSlider from "../../lib/lidl-modules/pageSlider/pageSlider";



import {userActions} from "../actions/userActions";
const Handlebars = require("handlebars");

import {
    Uppload,
    Local,
    Camera,
    URL,
    xhrUploader,
    Crop,
    en,

} from "uppload";


$(document).ready (function () {
    var lidlRTO = window.lidlRTO;

    let pagesliderContainer = document.getElementById("pageslider-container-01");
    $.get('/webpack/user/templates/addUser/addUser-container.hbs', function (data) {
        var template = Handlebars.compile(data);
        pagesliderContainer.innerHTML = template();
        const groups = window.pageData.groups;
        buildPageSlider(pagesliderContainer, groups);
    });


});


function buildPageSlider(container, groups) {
    let token = lidlRTO.objectManager.createNewObjectToken();
    let pageslider = new PageSlider(container, token);
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
                    tmp: data[4].tmp ?? false,
                    tmpkey: data[4].userimg_tmpkey,
                },
                groups: data[3].groups,
                redirect: true,
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
            $.get('/webpack/user/templates/addUser/addUser-groups.hbs', function (data) {
                var template = Handlebars.compile(data);
                let p3Data = {
                    groups: groups,
                }
                let page3 = pageslider.addPage(template(p3Data));
                let listElement = document.getElementById("userGroupSelect-list");
                let list = {selectedIndex: []};
                if(listElement){
                    list = new MDCList(listElement);
                    const listItemRipples = list.listElements.map((listItemEl) => new MDCRipple(listItemEl));
                }

                page3.setOnSaveCallback(function(){
                    let groups = [];
                    list.selectedIndex.forEach(index => {
                        let groupId = list.listElements[index].dataset.groupid;
                        groups.push(groupId)
                    })
                    page3.addObject("groups", groups);
                })

                //get 4th page
                $.get('/webpack/user/templates/addUser/addUser-img.hbs', function (data) {
                    var template = Handlebars.compile(data);
                    /**
                     * @param page4 {PageSlider.Page}
                     */
                    let page4 = pageslider.addPage(template());

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

                    //input elements
                    pageslider.addClassToLabel("test");

                    const uploader = new Uppload({
                        lang: en,
                        call: ".changeProfilePicture",
                        defaultService: "local",
                        uploader: xhrUploader({
                            endpoint: '/api/v1/usermod/tmp/uploadUserImage',
                            responseFunction: response => {
                                // Return the URL from the response text yourself
                                const json = JSON.parse(response);
                                return json; // Use your JSON response
                            },
                            fileKeyName: "image",
                            method: "POST"
                        })
                    });
                    uploader.use([new Local(), new Camera(), new URL()]);
                    uploader.use([
                        new Crop({
                            aspectRatio: 1
                        }),
                    ]);
                    uploader.on("upload", function(response){
                        const items = $(".userProfileImage");
                        let src = response.url;
                        let tmpkey = response.tmpkey;
                        $(items).each(function (img) {
                            $(this).attr("src", src + "?t=" + new Date().getTime());
                        });
                        page4.addObject('tmp', true);
                        page4.addObject('userimg_tmpkey', tmpkey);
                    });
                });
            });

        });
    });
}