var moment = require('moment');
moment().format();

var transformDateTimeString = function(dateString, format) {
    format = (format === undefined || typeof(format) !== "string") ? "text" : format;
    let weekDays = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag",  "Freitag", "Samstag"];
    var myDate = new Date(dateString);
    var month = (myDate.getMonth()+ 1).toString().length < 2 ? "0"+(myDate.getMonth()+ 1).toString() : (myDate.getMonth()+ 1).toString();
    var day = myDate.getDate().toString().length < 2 ? "0"+myDate.getDate().toString() : myDate.getDate().toString();

    var hours = myDate.getHours().toString().length < 2 ? "0"+myDate.getHours().toString() : myDate.getHours().toString();
    var minutes = myDate.getMinutes().toString().length < 2 ? "0"+myDate.getMinutes().toString() : myDate.getMinutes().toString();
    var seconds = myDate.getSeconds().toString().length < 2 ? "0"+myDate.getSeconds().toString() : myDate.getSeconds().toString();

    var date =  (format === "input") ? myDate.getFullYear() + "-" + month + "-" + day : day + "." + month + "." + myDate.getFullYear()
    var time =  hours + ":" + minutes;
    var dateTime =  date + " " + time;
    let dow = weekDays[myDate.getDay()];
    var dateTimeExtended = dow + ", " + dateTime;
    var dateExtended = dow + ", " + date;

    return {
        dateTime: dateTime,
        dateTimeExtended: dateTimeExtended,
        date: date,
        dateExtended: dateExtended,
        time: function (timeFormat) {
            switch(timeFormat) {
                case "hh:mm:ss":
                    return hours + ":" + minutes + ":" + seconds;
                case "hh:mm":
                    return time
            }
        },
    };
}

/**
 *
 * @param args {Object}
 * @returns {Counter}
 * @constructor
 */
let Counter = function(args) {
    let defaultArgs = {
        start: 0,
        min: null,
        max: null,
        step: 1,
    }
    args = (args === undefined) ? {}: args;
    args = Object.assign(defaultArgs, args);

    /**
     * @type {Integer} count
     */
    this.count = args.start;
    this.start = args.start;
    this.min = args.min;
    this.max = args.max;
    this.step = args.step;

    /**
     *
     * @returns {*}
     */
    this.get = function(){
        return this.count;
    }

    /**
     *
     * @returns {boolean|Integer}
     */
    this.increase = function(){
        this.current = this.count;
        this.count = this.count + this.step;
        if(this.max !== null){
            if(this.count > this.max){
                console.warn("Counter: Max exceeded.");
                this.count = this.current;
                return false;
            }
        }
        return this.count;
    }

    /**
     *
     * @returns {boolean|Integer}
     */
    this.decrease = function(){
        this.current = this.count;
        this.count = this.count - this.step;
        if(this.min !== null){
            if(this.count < this.min){
                console.warn("Counter: Min exceeded.");
                this.count = this.current;
                return false;
            }
        }
        return this.count;
    }

    /**
     *
     * @param val
     * @returns {boolean|Integer}
     */
    this.set = function(val) {
        let value = parseInt(val);
        if (this.max !== null && value > this.max) {
            return false;
        }
        else {
            if (this.min !== null && value < this.min) {
                console.warn("Counter: Min exceeded.");
                return false;
            }
            else {
                this.count = value;
                return this.count;
            }
        }
    }

    /**
     *
     * @returns {Integer}
     */
    this.reset = function(){
        this.count = this.start;
        return this.count;
    }
    return this;
}

/**
 *
 * returns a js date object that matches the given year, month, and days, relative to current date. Use to get a date e.g. 2 weeks from now.
 *
 * @param args {Object}
 * @param args.years years to add/sbustract
 * @param args.months months to add/substract.
 * @param args.weeks weeks to add/substract.
 * @param args.days days to add/substract.
 * @constructor
 */
var dateFromNow = function(args) {
    let defaults = {
        years: 0,
        months: 0,
        weeks: 0,
        days: 0
    }
    let vals = Object.assign(defaults, args)
    let current = Date.now();
    let duration = moment.duration({years: vals.years, months: vals.months, weeks: vals.weeks, days: vals.days})
    let m = moment(new Date());
    m.add(duration);
    return m.toDate();
}

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

var common = {
    escapeSelector: function(selector){
        return selector.replace( /(:|\.|\[|\]|,|=|@)/g, "\\$1" );
    },
    //find key in json by string in dot-notation
    refJSON: function (obj, str) {
        return str.split(".").reduce(function(o, x) { return o[x] }, obj);
    },

    stringToBoolean: function (string){
        var bool = undefined;
        var msg;
        try {
            if (typeof (string) !== "string") {
                msg = "Argument of type 'string' expected, but " + typeof (string) + "found.";
                throw new TypeError(msg);
            }
            //convert to lowercase
            string = string.toLowerCase();
            if (string === "true" || string === "1") {
                return true;
            }
            else if (string === "false" || string === "0") {
                return false;
            }
            msg = ("failed to parse string.");
            throw new Error(msg);
        }
        catch(e) {
            console.error("Caught exception: "+ msg);
        }
        return bool;
    },
}

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});

Date.prototype.toTimeInputValue = (function() {
    var local = new Date(this);
    var hours = local.getHours().toString().length < 2 ? "0" + local.getHours().toString() : local.getHours().toString();
    var minutes = local.getMinutes().toString().length < 2 ? "0" + local.getMinutes().toString() : local.getMinutes().toString();
    return hours + ":" + minutes;
});



export {transformDateTimeString, Counter, dateFromNow, getDataFromServer, common}