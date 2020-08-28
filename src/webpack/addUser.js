import {MDCTextField} from '@material/textfield';
import {MDCTextFieldHelperText} from '@material/textfield/helper-text';
import {MDCTextFieldIcon} from '@material/textfield/icon';


$(document).ready (function () {
    //setupTimePickerWidget()

    let pagesliderContainer = document.getElementById("pageslider-container-01");
    $.get('/static/unisams/js/user/templates/addUser-container.hbs', function (data) {
        var template = Handlebars.compile(data);
        pagesliderContainer.innerHTML = template();
        buildPageSlider(pagesliderContainer);
    });


});


function buildPageSlider(container) {
    let token = lidlRTO.objectManager.createNewObjectToken();
    let pageslider = new lidl.PageSlider(container, token);
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
            actions.addUser(apiData, args);
        },
        onError: function(){

        }
    });

    //get first page
    $.get('/static/unisams/js/user/templates//webpack/addUser-general.hbs', function (data) {
        var template = Handlebars.compile(data);
        let page1 = pageslider.addPage(template());

        //get second page
        $.get('/static/unisams/js/user/templates/webpack/addUser-pw.hbs', function (data) {
            var template = Handlebars.compile(data);
            let page2 = pageslider.addPage(template());

            //get third page
            $.get('/static/unisams/js/user/templates/webpack/addUser-details.hbs', function (data) {
                var template = Handlebars.compile(data);
                let page3 = pageslider.addPage(template());

                //get 4 page
                $.get('/static/unisams/js/user/templates/addUser-img.hbs', function (data) {
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


                    const textFields = [].map.call(document.querySelectorAll('.mdc-text-field'), function(el) {
                        return new MDCTextField(el);
                    });

                    // const helperText = new MDCTextFieldHelperText(document.querySelector('.mdc-text-field-helper-text'));

                    const helperFields = [].map.call(document.querySelectorAll('.mdc-text-field-helper-text'), function(el) {
                        return new MDCTextFieldHelperText(el);
                    });
                    const icon = new MDCTextFieldIcon(document.querySelector('.mdc-text-field-icon'));


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