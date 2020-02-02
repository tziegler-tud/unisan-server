const passport =        require('passport');
const LocalStrategy =   require('passport-local').Strategy;
const bcrypt =          require ('bcryptjs');
const userService = require('../services/userService');

var salt = bcrypt.genSaltSync(10);
var hash = bcrypt.hashSync("password", salt);

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
}, (name, password, done) => {
    console.log('Inside local strategy callback');
        // here is where you make a call to the database
        // to find the user based on their username or email address
        // for now, we'll just pretend we found that it was users[0]

        userService.getByUsername(name)
            .then(user => user ? function (){
                if(name === user._doc.username && bcrypt.compareSync(password, user._doc.hash)) {
                    console.log('password ok');
                    return done(null, user)
                }
                else {
                    console.log('login failed');
                    return done(null,false);

                }
            }() : function(){
                console.log("username not found. :-(");
                return done(null,false);
            }())
            .catch(err => console.log(err))

}));

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
    console.log('Inside serializeUser callback. User id is save to the session file store here');
    done(null, user._doc._id);
});


passport.deserializeUser((id, done) => {
    userService.getById(id)
        .then(user => user ? done(null, user): console.log("failed again."))
        .catch(err => console.log(err))
});

module.exports = passport;