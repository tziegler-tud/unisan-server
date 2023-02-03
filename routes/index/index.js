import express from 'express';
const router = express.Router();
import bodyParser from "body-parser";

var app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

/**
 * hooked at /
 * forward request to /unisams
 */
router.all('/', function(req, res, next) {
  res.redirect('/unisams')
});

export default router;