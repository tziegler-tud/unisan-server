
class User {

    constructor(userid, name, role) {
        this._id    = userid;
        this._role  = role;


        this._login = false; //user login disabled by default
        this._auth  = null;
    }


/* public methods */

    changeName (name){
        //TODO: check name spelling convention
        this.name = name;
    }

    changeRole (role){
        //TODO: check type
        this.role = role;
    }



/* getters & setters */

    set name (name) {
        this._name = name;
    }

    get name (){
        return this._name;
    }

    set role (role) {
        this._role = role;
    }

    get role (){
        return this._role;
    }

}

module.exports = User;