const multer = require("multer");

// upload new files to tmp directory
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, appRoot + '/data/uploads/tmp');
    },
    filename: function (req, file, callback) {
        callback(null, "tmp.jpg");
    }
});
var upload = multer({storage: storage});

module.exports = upload;