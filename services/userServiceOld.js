const User = require ('/models/user');
const UserScheme = require ('/schemes/userScheme');
const role = require ('/models/enum/role.js');

class UserServiceOld {

    constructor (){

    }

    static addUser (userdata){
        var id   = UserServiceOld.createId();
        var name = userdata.name;
        var role = userdata.role;

        var user = new User(this.createId(),name,role);

        //TODO: save user to database
        UserScheme.save(user);
    }

    static findUser (id){
        var user = new User(0,'test',role.manager); //dummy
        return user;
    }

    static removeUser (id){
        /*
        ...
         */
        //TODO: implement database access
        return true;
    }

    static createId () {
        //TODO: retrieve current id from database
        var id = 0; //dummy

        return id++;
    }
}

module.exports = new UserServiceOld();