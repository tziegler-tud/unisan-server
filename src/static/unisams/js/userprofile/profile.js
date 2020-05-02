(function (profile, $, undefined) {
// data aggregation for all the user-profile linked scripts.
//obviously, we need to fetch the user. Might reduce data to the one really needed later on by using a dedicated api call.

//TODO: move this to own namespace


    // find the userid
    profile.currentViewedUser = {};
    profile.currentViewedUser.userId = window.exploreUserId;


    /**
     *
     * @type {{resolve: resolve, subscribe: (function(): Promise<Object|String>), subscribers: {resolve: [], reject: []}, reject: reject, isActive: boolean}}
     */
    var pendingUserRequest = {
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

    var getUserFromServer = function(userId){
        pendingUserRequest.isActive = true;
        let url = "/unisams/usermod/" + userId;
        return new Promise(function(resolve, reject){
            $.ajax({
                url: url,
                type: 'GET',
                cache: false,
                isModified: false,
                data: {},
                success: function (context) {
                    pendingUserRequest.resolve(context);
                    resolve(context);
                },
                error: function(context){
                    pendingUserRequest.reject(context.status);
                    reject(context);
                }
            });
        })
    };

    profile.init = function(){

    };

    var subscribeToPendingRequest = function(){
        return new Promise(function(resolve,reject){
            if(!pendingUserRequest) reject("No pending user request.");
            else {

            }
        })
    };

    /**
     *
     * Service function to get the user data. Only one api call is done at a time.
     *
     *
     * @returns {Promise<Object|String>}
     */
    profile.getUser = function(){
        return new Promise(function(resolve, reject){
            let returnUser = function (user) {
                profile.currentViewedUser.user = user;
                resolve(profile.currentViewedUser.user);
            };
            let fail = function (reason) {
                reject(reason);
            };
          if (profile.currentViewedUser.user === undefined) {
              // check if request is already pending
              if (pendingUserRequest.isActive) {
                  pendingUserRequest.subscribe()
                      .then(function(context){
                          returnUser(context)
                      })
                      .catch(function(reason){
                          fail(reason)
                      })
              }
              else {
                  getUserFromServer(profile.currentViewedUser.userId)
                      .then(function(context){
                          returnUser(context)
                      })
                      .catch(function(reason){
                          fail(reason)
                      })
              }
          }
          else {
              resolve(profile.currentViewedUser.user)
          }
        });

    };

return profile

}(window.profile = window.profile||{}, jQuery));
