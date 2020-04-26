var showUserContent = function(self, args){

    var userid = args.userid;

    getDataFromServer("/unisams/usermod/"+userid,function(context){
        $.get('/static/unisams/js/templates/sidebar-user.hbs', function (data) {
            var template = Handlebars.compile(data);
            self.sidebarHTML.html(template(context));
            registerBackButton(self,".sidebar-back-btn");
        });
    })
};

var showAddUserContent = function(self, args){
    var context = {};
    var onConfirm = args.callback.onConfirm;
    $.get('/static/unisams/js/templates/sidebar-addUser.hbs', function (data) {
        var template = Handlebars.compile(data);
        self.sidebarHTML.html(template(context));
        registerBackButton(self,".sidebar-back-btn");
        registerConfirmButton(self, ".sidebar-confirm", function(){
            onConfirm($("#addUserForm-username").val(), $("#addUserForm-password").val(), $("#addUserForm-firstName").val(), $("#addUserForm-lastName").val());
        }.bind(args));
    });
};

export { showUserContent, showAddUserContent};