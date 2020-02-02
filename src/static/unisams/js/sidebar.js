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

    common.Sidebar.prototype.addErrorMessage = function(msg) {
        var errorHtml = $("<div/>", {
            "class": "sidebar-errormsg",
            text: msg
        });
        this.sidebarHTML.prepend(errorHtml);
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

        var res = {qualifications: {}};

        getDataFromServer("/unisams/usermod/"+userId,function(context){
            res.exploreUser = context;
            if (res.qualifications.byType){
                action(res)
            }
        });

        getDataFromServer("/unisams/qualification/groupByType", function(context){
            res.qualifications.byType = context;
            if (res.exploreUser){
                action(res);
            }
        });
        var action = function(context){
            $.get('/static/unisams/js/templates/sidebar-addUserQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    //helper to find qualification document in groupByType array
                    var findQualById = function(byTypeArr, id){
                        var localmatch;
                        byTypeArr.forEach(function(qual){
                            var match = qual.values.find(qualEntry => qualEntry._id === id);
                            if (match != null) {
                                localmatch = match;
                            }
                        });
                        return localmatch;
                    };
                    const id = document.getElementById("qual-name").selectedOptions[0].id;
                    data = {
                        qualification: findQualById(res.qualifications.byType, id),
                        acquiredDate: $("#qual-acquiredDate").val(),
                        expireDate: $("#qual-expireDate").val(),
                        trainingDate: $("#qual-trainingDate").val(),
                    };
                    onConfirm(args.userid, data);
                }.bind(args));
                var q = $("#qual-type");
                q.on("change",function(e){
                    var typeData = res.qualifications.byType.find(element => element._id === e.target.value);
                    var qualNameObject = document.getElementById("qual-name");
                    // remove existing options
                    qualNameObject.options.length = 0;
                    //add available options for selected type
                    typeData.values.forEach(function (el, index){
                        const option = document.createElement('option');
                        option.id = el._id;
                        option.value = el.name;
                        option.innerHTML = el.name;
                        option.defaultSelected = false;
                        option.selected = false;
                        qualNameObject.options[index] = option;
                    });


                })
            });
        };
    };

    var addUpdateUserQualificationContent = function(self, args){

        var userId = args.userid;
        var qualId = args.qualificationId;
        var onConfirm = args.callback.onConfirm;
        var onDelete = args.callback.onDelete;

        var res = {qualifications: {}};

        getDataFromServer("/unisams/usermod/"+userId,function(context){
            res.exploreUser = context;
            res.currentQualification = context.qualifications.find(qual => qual._id === qualId);
            if (res.qualifications.byType){
                action(res)
            }
        });

        getDataFromServer("/unisams/qualification/groupByType", function(context){
            res.qualifications.byType = context;
            if (res.exploreUser){
                action(res);
            }
        });

        var action = function(context){
            $.get('/static/unisams/js/templates/sidebar-updateUserQualification.hbs', function (data) {
                var template = Handlebars.compile(data);
                context.qualification = context.exploreUser.qualifications.find(qual => qual._id === qualId);
                self.sidebarHTML.html(template(context));
                registerBackButton(self,".sidebar-back-btn");
                registerConfirmButton(self, ".sidebar-confirm", function(){
                    //helper to find qualification document in groupByType array

                    const id = document.getElementById("qual-name").selectedOptions[0].id;
                    data = {
                        id: qualId,
                        qualification: findQualById(res.qualifications.byType, id),
                        acquiredDate: $("#qual-acquiredDate").val(),
                        expireDate: $("#qual-expireDate").val(),
                        trainingDate: $("#qual-trainingDate").val(),
                    };
                    onConfirm(args.userid, data);
                }.bind(args));

                registerButton (self, ".sidebar-delete", function(){
                    // delete array entry
                    data = {
                        id: qualId,
                        qualification: res.currentQualification.qualification,
                    };
                    onDelete(args.userid, data);
                });

                var findQualById = function(byTypeArr, id){
                    var localmatch;
                    byTypeArr.forEach(function(qual){
                        var match = qual.values.find(qualEntry => qualEntry._id === id);
                        if (match != null) {
                            localmatch = match;
                        }
                    });
                    return localmatch;
                };

                var q = $("#qual-type");
                // populate selects with current content as default
                var populateCurrentDefault = function(currentQualification){
                    // check if data are valid
                    if (!checkQualificationDataValidity(currentQualification)){
                        console.warn("trying to read corrupted data");
                        self.addErrorMessage("trying to read corrupted data!");
                    }
                    else {
                        var typeData = res.qualifications.byType.find(element => element._id === currentQualification.qualification.qualType);
                        var qualNameObject = document.getElementById("qual-name");
                        // select current as default
                        q.children('option').filter(function (i, e) {
                            return e.text === currentQualification.qualification.qualType
                        }).attr('selected', 'selected');
                        //add available options for selected type, with current selected as default
                        typeData.values.forEach(function (el, index) {
                            const option = document.createElement('option');
                            option.id = el._id;
                            option.value = el.name;
                            option.innerHTML = el.name;
                            option.selected = (el.name === currentQualification.qualification.name) ? "selected" : "";
                            qualNameObject.options[index] = option;
                        });
                    }
                };
                populateCurrentDefault(res.currentQualification);
                // listener to update names if type changes
                $(q).on("change",function(e){
                    var typeData = res.qualifications.byType.find(element => element._id === e.target.value);
                    var qualNameObject = document.getElementById("qual-name");
                    // remove existing options
                    qualNameObject.options.length = 0;
                    //add available options for selected type
                    typeData.values.forEach(function (el, index){
                        const option = document.createElement('option');
                        option.id = el._id;
                        option.value = el.name;
                        option.innerHTML = el.name;
                        option.defaultSelected = false;
                        option.selected = false;
                        qualNameObject.options[index] = option;
                    });
                });

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

    var registerButton = function(self, selector, action){
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

    var checkQualificationDataValidity = function(currentQualification){
        if(currentQualification == null) {
            return false;
        }
        else {
            if (currentQualification.qualification.qualType == null || currentQualification.qualification.name == null) {
                return false;
            }
        }
        return true;

    };



    return common.Sidebar;



}(window.common = window.common || {}, jQuery));