const passport = require('passport');
const passportService = require('../services/passport');
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jwt-simple');
//const config = require('../config/keys');

const config.secret = process.env.secret;

const requireAuth = passport.authenticate('jwt', {session: false});
const requireSignin = passport.authenticate('local', {session: false});


function tokenForUser(user){

    const timestamp = new Date().getTime();
    return jwt.encode({sub: user.id, iat: timestamp}, config.secret);
}
    
    //NOTE THIS IS HOW TO USE MIDDLEWARE TO REQUIRE JSON WEB TOKEN AUTH ON A ROUTE
    // router.get('/', requireAuth, function(req,res){
    //     res.send("Hi There");
    // })

router.post('/signin', requireSignin, function(req,res,next){
    
    res.send({token:tokenForUser(req.user)});
});

router.get('/userid', requireAuth, function(req,res,next){

    let userId = jwt.decode(req.headers.authorization, config.secret);

    res.json({userId: userId.sub});

    //console.log("Email for this token",jwt.decode(req.headers.))
});

router.post('/signup', function(req,res,next){

    const email = req.body.email;
    const password = req.body.password;

    if(!email || !password) {
        return res.status(422).send({error:"You must provide email and password"});
    }

    //see if user with that email exists
    User.findOne({email:email}, function(err, existingUser){

        if(existingUser) { 

        return res.status(422).send({error:'Email is in use'});
    }

    //if a with email does NOT exist create and save user record
    const user = new User({email:email, password:password, questions:[], numQuestions:0});

    user.save(function(err){
        if(err) {return next(err)};

        res.json( { token: tokenForUser(user)});
    })

    })

});


module.exports = router;
