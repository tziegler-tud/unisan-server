import express from 'express';
var router = express.Router();
import bodyParser from "body-parser";
import protocolService from "../../services/apps/protocolService.js";
import AuthService from "../../services/authService.js";


var app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// routes
router.get("/", editDoc)

function editDoc(req, res, next) {
    //get protocol document
    res.render("unisams/apps/protocol/protocol-editor", {
        title: "unisan apps - Dokumentation",
        user: {},
        document: {title: "Neues Protokoll", content: {}},
        version: "public",
    })
}



export default router;


