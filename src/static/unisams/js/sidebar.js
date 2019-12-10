(function (common,$,undefined) {

    common.Sidebar = function(parentId, content){

        this.sidebarHTML = createHTML(this, content);
        this.parent = $('#'+ parentId);
        this.parent.append(this.sidebarHTML);

        this.isActive = false;

        return this;
    };

    common.Sidebar.prototype.addContent = function(type, args){
        var self = this;

        switch(type){

            default:
                console.warn("Sidebar: no content type given!");
                addUserContent(self, args);
                break;

            case "user":
                addUserContent(self, args);
                break;

            case "UserAddDBKey":
                addInsertDBKeyContent(self, args);
                break;

            case "UserAddQualification":
                addInsertUserQualificationContent(self,args);
                break;

            case "UserUpdateQualification":
                addUpdateUserQualificationContent(self,args);
                break;

            case "QualificationCreate":
                addCreateQualificationContent(self,args);
                break;

            case "QualificationUpdate":
                addUpdateQualificationContent(self,args);
                break;

        }

    };

    common.Sidebar.prototype.toggle = function(){

        if(this.isActive){
            this.isActive = false;
            this.sidebarHTML.removeClass("sidebar-active");
            this.parent.removeClass("sidebar-active");
        }
        else {
            this.isActive = true;
            this.sidebarHTML.addClass("sidebar-active");
            this.parent.addClass("sidebar-active");
        }
    };

    common.Sidebar.prototype.show = function(){
        this.sidebarHTML.addClass("sidebar-active");
        this.parent.addClass("sidebar-active");

        this.isActive = true;
    };

    common.Sidebar.prototype.hide = function(){
        this.sidebarHTML.removeClass("sidebar-active");
        this.parent.removeClass("sidebar-active");

        this.isActive = false;
    };

    var addUserContent = function(self, args){

        var userid = args.userid;

        getDataFromServer("/unisams/usermod/"+userid,function(context){
            $.get('/static/unisams/js/templates/sidebar-user.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
            });
        })
    };

    var addInsertDBKeyContent = function(self, args){

        var userid = args.userid;
        var onConfirm = args.callback.onConfirm;

        getDataFromServer("/unisams/usermod/"+userid,function(context){
            $.get('/static/unisams/js/templates/sidebar-addDBKey.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    onConfirm(args.userid, $("#key").val(), $("#value").val());
                }.bind(args));
            });
        })
    };

    var addInsertUserQualificationContent = function(self, args){

        var userId = args.userid;
        var onConfirm = args.callback.onConfirm;

        var res = {};

        getDataFromServer("/unisams/usermod/"+userId,function(context){
            res.exploreUser = context;
            if (res.qualifications){
                action(res)
            }
        });

        getDataFromServer("/unisams/qualification/getAllByType", function(context){

            res.qualifications = context;
            if (res.exploreUser){
                action(res)
            }
        });

        var action = function(context){
            $.get('/static/unisams/js/templates/sidebar-addUserQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    data = {
                        name: $("#qual-name").val(),
                        acquiredDate: $("#qual-acquiredDate").val(),
                        expireDate: $("#qual-expireDate").val(),
                        trainingDate: $("#qual-trainingDate").val(),
                    };
                    onConfirm(args.userid, data);
                }.bind(args));
            });
        };
    };

    var addUpdateUserQualificationContent = function(self, args){

        var userId = args.userid;
        var qualId = args.qualificationId;
        var onConfirm = args.callback.onConfirm;

        var res = {};

        getDataFromServer("/unisams/usermod/"+userId,function(context){
          res.exploreUser = context;
            if (res.qualifications){
                action(res)
            }
        });

        getDataFromServer("/unisams/qualification/getAllByTypes", function(context){
            res.qualifications = context;
            if (res.exploreUser){
                action(res)
            }
        });

        var action = function(res){
            $.get('/static/unisams/js/templates/sidebar-updateUserQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                context.qualification = context.exploreUser.qualifications.find(qual => qual._id === qualId);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    data = {
                        id: qualId,
                        name: $("#qual-name").val(),
                        acquiredDate: $("#qual-acquiredDate").val(),
                        expireDate: $("#qual-expireDate").val(),
                        trainingDate: $("#qual-trainingDate").val(),
                    };
                    onConfirm(args.userid, data);
                }.bind(args));
            });
        };
    };

    var addUpdateQualificationContent = function(self, args){

        var qualId = args.qualificationId;
        var onConfirm = args.callback.onConfirm;

        var res = {};

        var action = function(context){
            $.get('/static/unisams/js/templates/sidebar-updateQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    data = {
                        id: qualId,
                        qualType: $("#key").val(),
                        name:  $("#value").val(),
                    };
                    onConfirm(qualId, data);
                }.bind(args));
            });
        };

        getDataFromServer("/unisams/qualification/"+qualId,function(context){
            res.qualification = context;
            action(res)
        })
    };

    var addCreateQualificationContent = function(self, args){

        var onConfirm = args.callback.onConfirm;

        getDataFromServer("/unisams/qualification/getAllByType", function(context){

            $.get('/static/unisams/js/templates/sidebar-createQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    data = {
                        qualType: $("#key").val(),
                        name:  $("#value").val(),
                    };
                    onConfirm(false, data);
                }.bind(args));
            });
        });


    };



    var registerBackButton = function(self, selector){

      $(selector).each(function(){
          $(this).on("click", function(e){
              self.toggle();
              $(this).toggleClass("btn-rotate");
          });
      })
    };

    var registerConfirmButton = function(self, selector, action){
        var args = this;
        $(selector).on("click", function(args){
            action();
        });
    };

    var getDataFromServer  = function(url, callback){

        // get qualification data from server
        $.ajax({
            url: url,
            type: 'GET',
            cache: false,
            isModified: false,
            data: {},
            success: callback,
        });
    };



    var createHTML = function(self){

        return $('<div/>', {
            id: "sidebar-container",
            class: "sidebar-container",

        });
    };

    return common.Sidebar;



}(window.common = window.common || {}, jQuery));