const multer = require("multer");
var fs = require('fs-extra');

//create directories if not exists
let dir = appRoot + "/src/data/uploads/tmp/";
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// upload new files to tmp directory
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, dir);
    },
    // filename: function (req, file, callback) {
    //     callback(null, file.filename);
    // }
});
var upload = multer({storage: storage});

module.exports = upload;