(function (profile, $, undefined) {
// data aggregation for all the user-profile linked scripts.
//obviously, we need to fetch the user. Might reduce data to the one really needed later on by using a dedicated api call.

    var observers = [];

    /**
     * Constructor of profile element. Instantiate this for one call of a profile-related request.
     *
     * Singleton
     *
     * @constructor
     *
     */

    profile.Profile = function(userId){
        // find the userid
        this.currentViewedUser = {};
        this.currentViewedUser.userId = userId;
        /**
         *
         * @type {{resolve: resolve, subscribe: (function(): Promise<Object|String>), subscribers: {resolve: [], reject: []}, reject: reject, isActive: boolean}}
         */
        this.pendingUserRequest = {
            isActive: false,
            subscribers: {
                resolve: [],
                reject: [],
            },
            subscribe: function(){
                // allow subscribing to request while it is pending.
                let res;
                let rej;
                let p = new Promise(function(resolve,reject){
                    res = resolve;
                    rej = reject;
                });
                this.subscribers.resolve.push(res);
                this.subscribers.reject.push(rej);
                return p;
            },
            resolve: function(context){
                this.isActive=false;
                //push result to all subscribers.
                this.subscribers.resolve.forEach(function(el){
                    el(context);
                });
                this.subscribers.resolve = [];
                this.subscribers.reject = [];
            },
            reject: function(context){
                this.isActive=false;
                //push result to all subscribers.
                this.subscribers.reject.forEach(function(el){
                    el(context);
                });
                this.subscribers.resolve = [];
                this.subscribers.reject = [];
            },
        };
        return this;
    };

    profile.init = function(){

    };



    var getUserFromServer = function(self, userId){
        self.pendingUserRequest.isActive = true;
        let url = "/api/v1/usermod/" + userId;
        return new Promise(function(resolve, reject){
            $.ajax({
                url: url,
                type: 'GET',
                cache: false,
                isModified: false,
                data: {},
                success: function (context) {
                    self.pendingUserRequest.resolve(context);
                    resolve(context);
                },
                error: function(context){
                    self.pendingUserRequest.reject(context.status);
                    reject(context);
                }
            });
        })
    };



    var subscribeToPendingRequest = function(self){
        return new Promise(function(resolve,reject){
            if(!self.pendingUserRequest) reject("No pending user request.");
            else {

            }
        })
    };

    /**
     *
     * Service function to get the user data. Only one api call is done at a time.
     *
     * @params subscribe {Boolean}
     * @params obj {Object} subscribing object. Must implement an "update" function
     *
     * @returns {Promise<Object|String>}
     */
    profile.Profile.prototype.getUser = function(){
        var self = this;
        return new Promise(function(resolve, reject){
            let returnUser = function (user) {
                self.currentViewedUser.user = user;
                resolve(self.currentViewedUser.user);
            };
            let fail = function (reason) {
                reject(reason);
            };
            if (self.currentViewedUser.user === undefined) {
              // check if request is already pending
              if (self.pendingUserRequest.isActive) {
                  self.pendingUserRequest.subscribe()
                      .then(function(context){
                          returnUser(context)
                      })
                      .catch(function(reason){
                          fail(reason)
                      })
              }
              else {
                  getUserFromServer(self, self.currentViewedUser.userId)
                      .then(function(context){
                          returnUser(context)
                      })
                      .catch(function(reason){
                          fail(reason)
                      })
              }
            }
            else {
              resolve(self.currentViewedUser.user)
            }
        });

    };

    /**
     *
     * Service function to get the user data. Only one api call is done at a time.
     * Callee is subscribed as observer to be notified if user data changes
     *
     * @params subscribe {Boolean}
     * @params obj {Object} subscribing object. Must implement a "update" function
     *
     * @returns {Promise<Object|String>}
     */

    profile.Profile.prototype.getUserAndSubscribe = function(observer){
        observers.push(observer);
        return this.getUser();

    };

    profile.Profile.prototype.refreshUser = function(){
        var self = this;
        return new Promise(function(resolve, reject) {
            let returnUser = function (user) {
                self.currentViewedUser.user = user;
                resolve(self.currentViewedUser.user);
            };
            let fail = function (reason) {
                reject(reason);
            };
            getUserFromServer(self, self.currentViewedUser.userId)
                .then(function (context) {
                    returnUser(context)
                })
                .catch(function (reason) {
                    fail(reason)
                })
        });
    };

    profile.Profile.prototype.notifyObservers = function(){
        this.getUser().then(function(user){
            observers.forEach(function(ob){
                ob.update(user)
            })}
        ).catch(function(){

        });
    };

    profile.Profile.prototype.updateDBKey = function(keyIdentifier, value, args, callback){
        callback = (callback == null) ? function(){} : callback;
        var self = this;
        var data = {
            key: keyIdentifier,
            value: value,
            args: args,
        };
        $.ajax({
            url: "/api/v1/usermod/updateKey/" + self.currentViewedUser.userId,
            // make put for safety reasons :-)
            type: 'PUT',
            contentType: "application/json; charset=UTF-8",
            dataType: 'json',
            data: JSON.stringify(data),
            success: function(result) {
                self.refreshUser().then(function(){
                    self.notifyObservers();
                }).catch(reason => console.error(reason));
                callback();
            }
        });
    };

return profile;

}(window.profile = window.profile||{}, jQuery));
