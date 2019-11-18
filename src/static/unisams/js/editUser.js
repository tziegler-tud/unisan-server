var lidlRTO = window.lidlRTO;

$(document).ready (function () {



    const content = {
        title: "Nutzer löschen",
        message: "U sure bro?"
    };

    var userid = window.exploreUserId;

    var delUserAction = function(){actions.deleteUser(userid)};

    var token = lidlRTO.objectManager.createNewObjectToken();
    const dialog01 = new lidl.Dialog(token, ".userDelete", delUserAction, 'confirmDelete', content);
    lidlRTO.objectManager.addObject(dialog01, token);



    const content2 = {
        title: "Bild hochladen",
    };

    var imgUploadAction = function(){};

    var token2 = lidlRTO.objectManager.createNewObjectToken();
    const dialog02 = new lidl.Dialog(token2, ".changeProfilePicture", imgUploadAction, 'imageUpload', content2);
    lidlRTO.objectManager.addObject(dialog02, token2);


    var manualUploader = new qq.FineUploader({
        element: document.getElementById('imgUpload'),
        template: 'qq-template-manual-trigger',
        request: {
            method: 'POST',
            endpoint: '/unisams/usermod/' + userid + "/uploadUserImage",
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

        callbacks: {
            onComplete: function(){
                const img = $("#userProfileImage");
                const src = img.attr("src");
                img.attr("src", src + "?t=" + new Date().getTime());
            }
        }
    });

    qq(document.getElementById("confirmBtn" + token2)).attach("click", function() {
        manualUploader.uploadStoredFiles();
    });
});