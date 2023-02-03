import UserService from "../userService.js";

class UserAdapter {
    static findAccount(ctx, id, token){
        return new Promise(function(resolve, reject){
            UserService.getById(id)
                .then(user=> {
                    if(user){
                        let result = {
                            accountId: user.id,
                            scope: undefined,
                            rejected: undefined,
                            async claims(use, scope, claims, rejected) { return { sub: id }; },
                        };
                        resolve( result);
                    }
                })


        })
    }
}