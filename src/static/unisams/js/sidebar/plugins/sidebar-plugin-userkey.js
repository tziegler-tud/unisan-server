var showInsertDBKeyContent = function(self, args){
    // the most generic function, currently not used but left here for future usage

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

var showInsertUserKeyContent = function(self, args){

    var userId = args.userid;
    var onConfirm = args.callback.onConfirm;
    var opt = false;

    var res = {dataset: {}};

    getDataFromServer("/unisams/usermod/"+ userId,function(context){
        res.exploreUser = context;
        if (res.dataset.user){
            action(res)
        }
    });

    getDataFromServer("/unisams/dataset/user/getCategories", function(context){
        res.dataset.user = context;
        if (res.exploreUser){
            action(res);
        }
    });

    var action = function(context) {
        $.get('/static/unisams/js/templates/sidebar-addUserKey.hbs', function (data) {

            var template = Handlebars.compile(data);
            self.sidebarHTML.html(template(context));

            var catKey = "";
            var key = "";

            registerBackButton(self, ".sidebar-back-btn");
            registerConfirmButton(self, ".sidebar-confirm", function () {
                var r = document.getElementById("userkey-key");
                var key = catKey + "." + r.value;
                var funcArgs = {
                    isArray: r.options[r.selectedIndex].dataset.isarray
                };
                var val = {
                    value: document.getElementById("userkey-value").value,
                    title: "TestTitle2",
                };
                onConfirm(userId, key, val, funcArgs);
            }.bind(args));
            var q = document.getElementById("userkey-category");
            let doc = res.dataset.user.categories;
            q.addEventListener("change", function(e){
                populateUserKeys(self, doc, q.options[q.selectedIndex].dataset.datasetid, {
                    createNewEntry: true,
                });
                catKey = q.options[q.selectedIndex].value;
            });
            // Apply onchange function initially
            var event = new Event('change');
            q.dispatchEvent(event);
        });
    };
};

var showUpdateUserKeyContent = function(self, args){

    var userId = args.userid;
    var keyId = args.keyId;
    var key = args.key;
    var catKey = args.catKey;
    var subKey = args.subKey;
    var value = args.value;
    var onConfirm = args.callback.onConfirm;
    var onDelete = args.callback.onDelete;

    var res = {dataset: {}};
    var corrupted = false;

    getDataFromServer("/unisams/usermod/"+ userId,function(context){
        res.exploreUser = context;
        if (res.dataset.user){
            action(res)
        }
    });

    getDataFromServer("/unisams/dataset/user/getCategories", function(context){
        res.dataset.user = context;
        if (res.exploreUser){
            action(res);
        }
    });

    var action = function(context) {
        $.get('/static/unisams/js/templates/sidebar-updateUserKey.hbs', function (data) {

            var template = Handlebars.compile(data);
            self.sidebarHTML.html(template(context));

            registerBackButton(self, ".sidebar-back-btn");
            registerConfirmButton(self, ".sidebar-confirm", function(){
                data = {
                    id: keyId,
                    value: document.getElementById("userkey-value").value
                };
                onConfirm(args.userid, key, data);
            }.bind(args));
            var q = document.getElementById("userkey-category");
            var r = document.getElementById("userkey-key");
            let doc = res.dataset.user.categories;
            q.addEventListener("change", function(e){
                populateUserKeys(self, doc, q.options[q.selectedIndex].dataset.datasetid, {
                    createNewEntry: true,
                    selectKey: subKey,
                    value: value,
                });
                catKey = q.options[q.selectedIndex].value;
            });
            // set current category
            setCurrentUserKey(q,catKey);
            // Apply onchange function initially
            var event = new Event('change');
            q.dispatchEvent(event);
        });
    };
};

var showViewUserKeyContent = function(self, args){

    var userId = args.userid;
    var keyId = args.keyId;
    var key = args.key;
    var catKey = args.catKey;
    var subKey = args.subKey;
    var value = args.value;

    var res = {dataset: {}};
    var corrupted = false;

    getDataFromServer("/unisams/user/"+ userId,function(context){
        res.exploreUser = context;
        if (res.dataset.user){
            action(res)
        }
    });

    getDataFromServer("/unisams/dataset/user/getCategories", function(context){
        res.dataset.user = context;
        if (res.exploreUser){
            action(res);
        }
    });

    let action = function(context) {
        $.get('/static/unisams/js/templates/sidebar-viewUserKey.hbs', function (data) {

            var template = Handlebars.compile(data);
            self.sidebarHTML.html(template(context));

            registerBackButton(self, ".sidebar-back-btn");
            var q = document.getElementById("userkey-category");
            var r = document.getElementById("userkey-key");
            var v = document.getElementById("userkey-value");
            let doc = res.dataset.user.categories;
            // set current category
            setCurrentUserKey(q,catKey);
            // Apply onchange function initially
            populateUserKeys(self, doc, q.options[q.selectedIndex].dataset.datasetid, {
                selectKey: subKey,
                html: value,
                disabled: false,
            });
            // disable inputs
            disableViewBox([q,r]);
        });
    };
};

/**
 * user data operations
 *
 **/

var populateUserKeys = function(sidebar, doc, compareValue, args){
    if (args === undefined) args = {};

    //find selected category
    var current = doc.find(element => element._id === compareValue);
    getDataFromServer("/unisams/dataset/user/getChildren/" + current._id, function (context) {
        var userkeyObject = document.getElementById("userkey-key");
        // remove existing options
        userkeyObject.options.length = 0;
        //add available options for selected type
        context.forEach(function (el, index) {
            const option = document.createElement('option');
            option.id = el._id;
            option.value = el.key;
            option.innerHTML = el.title;
            option.dataset.isarray = el.isArray;
            userkeyObject.options[index] = option;
        });
        if (args.createNewEntry) {
            // create delimiter
            const delimiter = createSelectDelimiter();
            userkeyObject.add(delimiter);

            // add option to create new key
            const option = document.createElement('option');
            option.value = "customData";
            option.innerHTML = "Neu anlegen...";
            option.dataset.isarray = "true";
            userkeyObject.add(option);

            //detect if this selected
            userkeyObject.addEventListener("change", function (e) {
                if (this.value === "customData") {
                    sidebar.enableOptional(".ak-customType");
                } else {
                    sidebar.disableOptional(".ak-customType");
                }
            });
            // fire "change" event once to catch case where no other options is present
            var event = new Event('change');
            userkeyObject.dispatchEvent(event);
        }
        if (args.selectKey) {
            setCurrentUserKey(userkeyObject, args.selectKey);
        }
        if (args.value) {
            var uservalueObject = document.getElementById("userkey-value");
            uservalueObject.value = args.value;
        }
        if (args.html) {
            var uservalueObject = document.getElementById("userkey-value");
            uservalueObject.innerHTML = args.html; // clear existing
        }
    });
};

var setCurrentUserKey = function(selectElement, key){
    $(selectElement).children('option').filter(function (i, e) {
        return e.value === key
    }).attr('selected', true);
};

export {showViewUserKeyContent, showUpdateUserKeyContent, showInsertUserKeyContent}