// data aggregation for all the event linked scripts.
//obviously, we need to fetch the event. Might reduce data to the one really needed later on by using a dedicated api call.

var observers = [];


/***
 * Constructor of event element. Instantiate this for one call of a event-related request.
 *
 *
 *
 * @constructor
 *
 */
var EventRequest = function(eventId, args){
    // find the event id
    this.currentViewedEvent= {};
    this.currentViewedEvent.id = eventId;

    this.args = args;
    return this;
};

/***
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

var getEventFromServer = function(eventId){
    pendingUserRequest.isActive = true;
    let url = "/api/v1/eventmod/" + eventId + "/populateParticipants";
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
 * @params subscribe {Boolean}
 * @params obj {Object} subscribing object. Must implement a "update" function
 *
 * @returns {Promise<Object|String>}
 */
EventRequest.prototype.getEvent = function(forceUpdate){
    var self = this;
    return new Promise(function(resolve, reject){
        let returnEvent = function (event) {
            self.currentViewedEvent.event = event;
            resolve(self.currentViewedEvent.event);
        };
        let fail = function (reason) {
            reject(reason);
        };
      if (self.currentViewedEvent.event === undefined || forceUpdate) {
          // check if request is already pending
          if (pendingUserRequest.isActive) {
              pendingUserRequest.subscribe()
                  .then(function(context){
                      returnEvent(context)
                  })
                  .catch(function(reason){
                      fail(reason)
                  })
          }
          else {
              getEventFromServer(self.currentViewedEvent.id)
                  .then(function(context){
                      returnEvent(context)
                  })
                  .catch(function(reason){
                      fail(reason)
                  })
          }
      }
      else {
          resolve(self.currentViewedEvent.event)
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

EventRequest.prototype.getEventAndSubscribe = function(observer){
    observers.push(observer);
    return this.getEvent();

};

EventRequest.prototype.refreshEvent = function(){
    var self = this;
    return new Promise(function(resolve, reject) {
        let returnEvent = function (event) {
            self.currentViewedEvent.event = event;
            resolve(self.currentViewedEvent.event);
        };
        let fail = function (reason) {
            reject(reason);
        };
        getEventFromServer(self.currentViewedEvent.id)
            .then(function (context) {
                returnEvent(context)
            })
            .catch(function (reason) {
                fail(reason)
            })
    });
};

EventRequest.prototype.notifyObservers = function(){
    this.getEvent(true).then(function(event){
        observers.forEach(function(ob){
            ob.update(event)
        })}
    ).catch(function(){

    });
};

EventRequest.prototype.update = function(keyIdentifier, value, args, callback){
    callback = (callback == null) ? function(){} : callback;
    var self = this;
    var data = {
        key: keyIdentifier,
        value: value,
        args: args,
    };
    // $.ajax({
    //     url: "/unisams/event/update/" + self.currentViewedEvent.id,
    //     // make put for safety reasons :-)
    //     type: 'PUT',
    //     contentType: "application/json; charset=UTF-8",
    //     dataType: 'json',
    //     data: JSON.stringify(data),
    //     success: function(result) {
    //         self.refreshEvent().then(function(){
    //             self.notifyObservers();
    //         }).catch(reason => console.error(reason));
    //         callback();
    //     }
    // });
    console.error("eventRequest.update: Not implemented")

};

EventRequest.prototype.checkIfUserIsRegistered = function(user, args){
    let self = this;
    let defaults = {
        role: "any",
    }
    if (args === undefined) args = {};
    args  = Object.assign(defaults, args);
    var index = -1;
    let event = self.currentViewedEvent.event;
    // create array of participants by id
    try {
        //check if array contains elements
        if (event.participants.length > 0) {
            if (args.role === "any"){
                index = event.participants.findIndex(e => {
                    return (e.user._id.toString() === user.id)
                });
            }
            else {
                index = event.participants.findIndex(e => {
                    return (e.user._id.toString() === user.id && e.role.toString() === args.role)
                });
            }
        }
        //false if no user are registered
        else return false;
    }
    catch (e) {
        if (e instanceof TypeError) {
            console.error("Exception:" + e);
            console.error("Aborting operation to ensure data integrity.");
            throw e;
        } else {
            console.error("Unhandled exception: " + e);
            throw e;
        }
    }
   return index > -1;
}

export {EventRequest}
