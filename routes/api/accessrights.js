const express = require('express');
const router = express.Router();
const userService = require('../../services/userService');
const authService = require('../../services/authService');

var path = require('path');



function checkUrlAccess(req, res, next){
    authService.checkUrlPermission(req.user,req.method,req.originalUrl)
        .then(function(result){
            if(result){
                console.log("authorization successful!");
                next();
            }
            else {
                console.log("authorization failed!");
                res.status(403).send();
            }
        })
        .catch(err => next(err))
}

// routes

//check url access by user group
router.use('/*', checkUrlAccess);

//access rights modifications require respective rights. set role paths carefully!
router.post('/addUserGroup/:id', addUserGroup);
router.post('/setUserRole/:id', setUserRole);
router.post('/addGroupToAllUser', addGroupToAllUser);

module.exports = router;

function addUserGroup(req, res, next){
    userService.addUserGroup(req, req.params.id, req.body.userGroupId)
        .then(function(user) {
            res.json(user);
        })
        .catch(err => next(err));
}

function setUserRole(req, res, next){
    //get user list
    userService.setUserRole(req, req.params.id, req.body.role, req.user)
        .then(function(result){
            res.status(200).send();
            })
        .catch(err=>next(err))
}

function addGroupToAllUser(req, res, next){
    //get user list
    userService.getAll()
        .then(function(userlist){
            userlist.forEach(function(user){
                userService.addUserGroup(user.id, req.body.groupId)
                    .then(user=>console.log("user " + user.username + "has been assigned the role."))
            })
        })
}
