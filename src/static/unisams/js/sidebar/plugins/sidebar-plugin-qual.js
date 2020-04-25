import "./shared"

var showInsertUserQualificationContent = function(self, args){

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
                const id = document.getElementById("qual-name").selectedOptions[0].id;
                data = {
                    qualification: findQualByIdInTypeArray(res.qualifications.byType, id),
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
                    qualNameObject.options[index] = option;
                });


            })
        });
    };
};

var showViewUserQualificationContent = function(self, args){

    var userId = args.userid;
    var qualId = args.qualificationId;

    var res = {qualifications: {}};

    var corrupted = false;

    getDataFromServer("/unisams/usermod/"+userId,function(context){
        res.exploreUser = context;
        res.currentQualification = context.qualifications.find(qual => qual._id === qualId);
        action(res)
    });

    var action = function(context){
        $.get('/static/unisams/js/templates/sidebar-viewUserQualification.hbs', function (data) {
            var template = Handlebars.compile(data);
            self.sidebarHTML.html(template(context));
            registerBackButton(self,".sidebar-back-btn");

            if(!populateCurrentQualificationDefault(self, res.qualifications.byType, res.currentQualification.qualification)){
                console.warn("trying to read corrupted data");
                self.addErrorMessage("trying to read corrupted data!",  function(data){
                    $("#sidebar-inner").before(data);
                });
                $("#qual-type").addClass("viewBox-disabled");
                $("#qual-name").addClass("viewBox-disabled");
                $("#qual-aquiredDate").addClass("viewBox-disabled");
                $("#qual-expireDate").addClass("viewBox-disabled");
                $("#qual-trainingDate").addClass("viewBox-disabled");
                corrupted = true;

            }
        });
    };
};

var showUpdateUserQualificationContent = function(self, args){

    var userId = args.userid;
    var qualId = args.qualificationId;
    var onConfirm = args.callback.onConfirm;
    var onDelete = args.callback.onDelete;

    var res = {qualifications: {}};

    var corrupted = false;

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
            self.sidebarHTML.html(template(context));
            registerBackButton(self,".sidebar-back-btn");
            registerConfirmButton(self, ".sidebar-confirm", function(){

                //helper to find qualification document in groupByType array
                const id = document.getElementById("qual-name").selectedOptions[0].id;
                data = {
                    id: qualId,
                    qualification: findQualByIdInTypeArray(res.qualifications.byType, id),
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
                if (corrupted) {
                    data.qualification = {qualType: "error", name: "error"}
                }
                onDelete(args.userid, data);
            });

            if(!populateCurrentQualificationDefault(self, res.qualifications.byType, res.currentQualification.qualification)){
                console.warn("trying to read corrupted data");
                self.addErrorMessage("trying to read corrupted data!",  function(data){
                    $("#sidebar-inner").before(data);
                });

                $("#qual-type").addClass("select-disabled");
                $("#qual-name").addClass("select-disabled");

                $(".sidebar-confirm").addClass("btn-disabled");

                corrupted = true;

            }
            // listener to update names if type changes
            var q = document.getElementById("qual-type");
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
                    option.selected = "";
                    qualNameObject.options[index] = option;
                });
            });

        });
    };
};

var showUpdateQualificationContent = function(self, args){

    var qualId = args.qualificationId;
    var onConfirm = args.callback.onConfirm;
    var onDelete = args.callback.onDelete;

    var res = {qualifications: {}};

    getDataFromServer("/unisams/qualification/groupByType", function(context){
        res.qualifications.byType = context;
        res.currentQualification = findQualByIdInTypeArray(context, qualId);
        action(res);

    });

    var action = function(context){
        var opt = false;
        $.get('/static/unisams/js/templates/sidebar-updateQualification.hbs', function (data) {
            var template = Handlebars.compile(data);
            self.sidebarHTML.html(template(context));
            registerBackButton(self,".sidebar-back-btn");
            registerConfirmButton(self, ".sidebar-confirm", function(){
                data = {
                    id: qualId,
                    qualType: $("#qual-type").val(),
                };
                if(opt) {
                    data.name = $("#custom-name").val();
                }
                else {
                    data.name = $("#qual-name").val();
                }
                onConfirm(qualId, data);
            }.bind(args));

            registerButton (self, ".sidebar-delete", function(){
                // delete array entry
                data = res.currentQualification;
                onDelete(qualId, data);
            });

            // populate selects with current content as default
            if(!populateCurrentQualificationDefault(self, res.qualifications.byType, res.currentQualification, {addCreateEntry: true})){
                console.warn("trying to read corrupted data");
                self.addErrorMessage("trying to read corrupted data!",  function(data){
                    $("#sidebar-inner").before(data);
                });

                $("#qual-type").addClass("select-disabled");
                $("#qual-name").addClass("select-disabled");
            }
            $("#qual-type").prop('disabled', 'disabled').addClass("select-disabled");
            // listener to update names if type changes
            var q = document.getElementById("qual-type");
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
                    option.selected = "";
                    qualNameObject.options[index] = option;
                });
            });
            $("#qual-name").on("change",function(e) {
                if (e.target.value === "enableOptional_custom-name"){
                    self.enableOptional(".ak-customName");
                    opt = true;
                }
                else {
                    self.disableOptional(".ak-customName");
                    opt = false;
                }
            });

        });
    };
};

var showCreateQualificationContent = function(self, args){

    var onConfirm = args.callback.onConfirm;
    var res = {qualifications: {}};

    getDataFromServer("/unisams/qualification/groupByType", function(context){
        res.qualifications.byType = context;
        action(res);

    });

    var action = function(context){
        var opt = false;
        $.get('/static/unisams/js/templates/sidebar-createQualification.hbs', function (data) {
            var template = Handlebars.compile(data);
            self.sidebarHTML.html(template(context));
            registerBackButton(self,".sidebar-back-btn");
            registerConfirmButton(self, ".sidebar-confirm", function(){
                data = {
                    name:  $("#qual-name").val(),
                };
                if(opt) {
                    data.qualType = $("#custom-type").val();
                }
                else {
                    data.qualType = $("#qual-type").val();
                }
                onConfirm(false, data);
            }.bind(args));
            $("#qual-type").on("change",function(e) {
                if (e.target.value === "enableOptional_custom-type"){
                    self.enableOptional(".ak-customType");
                    opt = true;
                }
                else {
                    self.disableOptional(".ak-customType");
                    opt = false;
                }
            });
        });
    };
};

var findQualByIdInTypeArray = function(byTypeArr, qualId){
    var localmatch;
    byTypeArr.forEach(function(qual){
        var match = qual.values.find(qualEntry => qualEntry._id === qualId);
        if (match != null) {
            localmatch = match;
        }
    });
    return localmatch;
};

var populateCurrentQualificationDefault = function(self, doc, current, args){
    if (args === undefined) args = {};

    // check if data are valid
    if (!checkQualificationDataValidity(current)){
        return false;
    }
    else {
        var typeData = doc.find(element => element._id === current.qualType);
        var qualNameObject = document.getElementById("qual-name");
        var q = document.getElementById("qual-type");
        // select current as default
        $(q).children('option').filter(function (i, e) {
            return e.text === current.qualType
        }).attr('selected', true);
        //add available options for selected type, with current selected as default
        typeData.values.forEach(function (el, index) {
            const option = document.createElement('option');
            option.id = el._id;
            option.value = el.name;
            option.innerHTML = el.name;
            option.selected = (el.name === current.name);
            qualNameObject.options[index] = option;
        });
        if (args.addCreateEntry) {
            var delimiter = createSelectDelimiter();
            qualNameObject.append(delimiter);

            var createEntry = document.createElement('option');
            createEntry.innerHTML = "Neu anlegen...";
            createEntry.value = "enableOptional_custom-name";
            createEntry.classList.add("option-createNewEntry");
            qualNameObject.append(createEntry);
        }
    }
    return true;
};

/**
 *
 * @param currentQualification
 * @returns {boolean}
 */

var checkQualificationDataValidity = function(currentQualification){
    if(currentQualification == null) {
        return false;
    }
    else {
        if (currentQualification.qualType == null || currentQualification.name == null) {
            return false;
        }
    }
    return true;

};

export {showInsertUserQualificationContent, showViewUserQualificationContent, showUpdateUserQualificationContent, showUpdateQualificationContent, showCreateQualificationContent};