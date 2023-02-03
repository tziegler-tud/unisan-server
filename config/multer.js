import multer from "multer";
import fs from 'fs-extra';
import path from "path";
import {fileURLToPath} from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "../src/data/uploads/tmp");
//create directories if not exists
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

export default upload;