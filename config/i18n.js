import express from "express";
import path from "path";
import i18n from "i18n";
var app = express();

i18n.configure({
    // setup some locales - other locales default to en silently
    locales:['en', 'de'],

    // where to store json files - defaults to './locales' relative to modules directory
    translationsPath: path.join(__dirname, 'locales'),

    directory: './locales',

    defaultLocale: 'en',

    register: global,

    // sets a custom cookie name to parse locale settings from  - defaults to NULL
    cookie: 'lang',
});

module.exports = i18n;

// module.exports = function(req, res, next) {
//
//     i18n.init(req, res);
//     res.local('__', res.__);
//
//     var current_locale = i18n.getLocale();
//
//     app.use(function(req, res, next) {
//         // express helper for natively supported engines
//         res.locals.__ = res.__ = function() {
//             return i18n.__.apply(req, arguments);
//         };
//
//         next();
//     });
//
//
//     return next();
// };
