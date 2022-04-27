const Handlebars = require("handlebars");
import {transformDateTimeString} from "./helpers";

Handlebars.registerHelper('hasRole', function(participant, roleString) {
    return participant.role === roleString;
});

Handlebars.registerHelper('nextItem', function (array, index, options) {
    return options.fn(array[index + 1]);
});
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('transformDateString', function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).date);
});

Handlebars.registerHelper('transformDateTimeString', function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).dateTime);
});

Handlebars.registerHelper('transformTimeString', function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).time("hh:mm"));
});

Handlebars.registerHelper('transformDateTimeStringExtended', function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).dateTimeExtended);
});

Handlebars.registerHelper('transformDateStringExtended', function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).dateExtended);
});

Handlebars.registerHelper('checklength', function (v1, v2, options) {
    'use strict';
    if (v1.length>v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('arrayNotEmpty', function (v1, options) {
    'use strict';
    if (!Array.isArray(v1)) return options.inverse(this)
    if (v1.length>0) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('greaterThan', function (v1, v2, options) {
    'use strict';
    if (v1>v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});


Handlebars.registerHelper('add', function (x, y) {
    return x+y;
});


Handlebars.registerHelper('timeFromNow', function (x) {
    return Date.now() + x;
});

Handlebars.registerHelper('userHasRole', function (user, role) {
    //handle populated and non-populated cases

    if (user.role === undefined) return false;
    let userRoleId = (user.role.id === undefined) ? user.role : user.role.id;
    let roleId = (role.id === undefined) ? role : role.id;
    return (userRoleId === roleId);
});

Handlebars.registerHelper('and', function (v1, v2, options) {
    'use strict';
    if (v1 && v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('or', function (v1, v2, options) {
    'use strict';
    if (v1 || v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});



// Legacy dateTime transformer for comparison, in case anything goes wrong
//
// Handlebars.registerHelper('transformDateString', function(dateString, format) {
//     format = (format === undefined || typeof(format) !== "string") ? "text" : format;
//     var myDate = new Date(dateString);
//     var month = (myDate.getMonth()+ 1).toString().length < 2 ? "0"+(myDate.getMonth()+ 1).toString() : (myDate.getMonth()+ 1).toString();
//     var day = myDate.getDate().toString().length < 2 ? "0"+myDate.getDate().toString() : myDate.getDate().toString();
//     var date;
//
//     if (format === "input") {
//         date = myDate.getFullYear() + "-" + month + "-" + day;
//     }
//     else {
//         date = day + "." + month + "." + myDate.getFullYear();
//     }
//     return new Handlebars.SafeString(date);
// });
//
// Handlebars.registerHelper('transformDateTimeString', function(dateString, format) {
//     format = (format === undefined || typeof(format !== "String")) ? "text" : format;
//     var myDate = new Date(dateString);
//     var month = (myDate.getMonth()+ 1).toString().length < 2 ? "0"+(myDate.getMonth()+ 1).toString() : (myDate.getMonth()+ 1).toString();
//     var day = myDate.getDate().toString().length < 2 ? "0"+myDate.getDate().toString() : myDate.getDate().toString();
//
//     var hours = myDate.getHours().toString().length < 2 ? "0"+myDate.getHours().toString() : myDate.getHours().toString();
//     var minutes = myDate.getMinutes().toString().length < 2 ? "0"+myDate.getMinutes().toString() : myDate.getMinutes().toString();
//     var date =  day + "." + month + "." + myDate.getFullYear() + " " + hours + ":" + minutes;
//
//     return new Handlebars.SafeString(date);
// });