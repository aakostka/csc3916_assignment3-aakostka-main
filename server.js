/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */
const dotenv = require("dotenv");
dotenv.config();
var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
const { verify } = require("crypto");
require('dotenv').config();
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }
    console.log(json);
    return json;
}

router.post('/signup', function(req, res) {
    console.log(req.body);
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});
router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY,{expiresIn: "10m"});
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});


router.get('/movies',verifyToken,function (req, res) {
    // console.log(req);
    // console.log(req.token,process.env.SECRET_KEY)
            try{
                Movie.find(function(err, movie) {
                    if (err) {
                        res.send(err);
                    }
                    res.json(movie);
                })
            }
            catch(err) {
                console.log(err);
                res.status(500).send(err);
            }
    
    })

router.post('/movies',verifyToken,function (req, res) {
    console.log(req.body);
    
    try{
        var movie = new Movie();
        movie.title = req.body.title;
        movie.releaseDate = req.body.releaseDate;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;
        if(!movie.title || !movie.releaseDate || !movie.genre || !movie.actors){
            res.status(400).send('All Fields are required to Save the movie');
        }
        else{
            console.log(req.body.title);
            Movie.countDocuments({title:req.body.title},function(err,count){
                if(!count){
                    movie.save(function(err){
                        if (err) {
                            if (err.code == 11000)
                                return res.json({ success: false, message: 'Movie Already Exists'});
                            else
                                return res.json(err);
                        }

                        res.json({success: true, msg: 'Successfully created inserted new movie.'})
                    });
                }
                else{
                    res.status(400).send('Movie already exists in the collection');
                }
            })
            
        }
    }
    catch(err) {
        res.status(500).send(err);
    }
})

router.get('/movies/:title',verifyToken,function (req, res) {
    var movieNew = new Movie();
    movieNew.title = req.params.title;

    console.log(movieNew.title);
    console.log(req.body);
    
    try{
        
        Movie.findOne({ title: movieNew.title }).select('title releaseDate genre actors').exec(function(err, movie) {
            if (err) {
                res.send(err);
            }
            console.log(typeof movie);
            if(!movie) {
                res.status(404).send('error in finding the movie');
            }
            else{
                res.json(movie);
            }
        })
    }
    catch(err) {
        console.log(err);
        res.status(500).send(err);
    }
})

router.delete('/movies/:title',verifyToken,function (req, res) {
    var movieNew = new Movie();
    movieNew.title = req.params.title;
    
    try{
        if(!movieNew.title){
            res.send({status:400,message:'Movie title needs to be entered to delete the movie'});
        }
        Movie.deleteOne({ title: movieNew.title }).select('title releaseDate genre actors').exec(function(err, data) {
            if (err) {
                res.send(err);
            }
            if(data.deletedCount===0) {
                res.status(404).send('error in finding the movie');
            }
            else{
                res.send({message:'Movie deleted successfully',data:data});
            }
            
        })
    }
    catch(err) {
        console.log(err);
        res.status(500).send(err);
    }
})

router.put('/movies/:title',verifyToken,function (req, res) {
    var movieNew = new Movie();
    movieNew.title = req.params.title;
    
    try{
        if(!movieNew.title){
            res.status(400).send('Movie title required to update the movie details');
        }
        else if(!req.body.title || !req.body.releaseDate || !req.body.genre || !req.body.actors){
            res.status(400).send('All fields are required to update the movie');
        }
        else{
            Movie.findOneAndUpdate({ title: movieNew.title },req.body,{useFindAndModify: false}).exec(function(err, movie) {
                if (err) {
                    res.send(err);
                }
                if(!movie) {
                    res.status(404).send('Error in finding the movie');
                }
                else{
                    console.log('Movie Updated successfully');
                    res.json(movie);
                }
            })
        } 
    }
    catch(err) {
        console.log(err);
        res.status(500).send(err);
    }
})
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    console.log(bearerHeader);
    if(typeof bearerHeader !== 'undefined'){
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];

        jwt.verify(bearerToken,process.env.SECRET_KEY,function(err,authData){
            if(err) {
                return res.send({status:403,message:"Unauthorized for this route"});
            }
            console.log(authData);
            req.user = authData;
            next();
        })

    }
    else{
        res.sendStatus(403);
    }
 };



app.use('/', router);
app.listen(process.env.PORT || 8080,function(){
    console.log('App listening on port ' + process.env.PORT)
});
module.exports = app; // for testing only
