var express = require("express");
var moment = require("moment");
var router = express.Router();
// var neword = require("../models/orders.js");
var user = require("../models/user.js");
var passport = require("passport");
var crypto = require("crypto");
var api = require("../models/api.js");
var authController = require("../controllers/authentication.js");
const nodemailer = require('nodemailer');
var moment = require('moment');

// moment.setDefaultFormat('YYYY-MM-DDTHH:mm:ss.SSSZ');


//SEED FILE

// router.get('/userStatus', function(req,res){
//     authController.data.checkUserDetails("enzoyu5488@yahoo.com", function(status) {
//         console.log(status);
//         if(status){
//             res.send("true");
//         }
//         else{
//             res.send("false");
//         }
//     })
// })

router.get('/userList', function(req,res){
    var objectThrow = {
        page:{
            userId: String,
            page: String,
            next: String
        },
        data: []
    }
    if(typeof req.query.userId == 'undefined'){
        req.query.userId = "";
    }
    
    req.headers['x-api-key'] = req.sanitize(req.headers['x-api-key']);
    objectThrow.page.userId = req.sanitize(req.query.userId);
    objectThrow.page.page = req.sanitize(req.query.paginate);
    if(typeof req.query.paginate == 'undefined'){
        objectThrow.page.page = 10;
    }
    if(typeof req.query.userId == 'undefined'){
        objectThrow.page.userId = "";
    }
    console.log(objectThrow.page.userId);
    console.log(objectThrow.page.page);
    console.log(typeof(req.query.userId))

    var newArray = [];
    authController.data.getUserDetails({}, function(users){
        console.log(typeof(users.firstName));
        var totalCount = users.length-1;
        var next = 0;
        for(var x=0; x<=totalCount; x++){
            if(req.query.userId == ''){
                for(var y=totalCount; y>=(totalCount-objectThrow.page.page); y--){
                    console.log(y)
                    newArray.push(users[y]);
                }
                next = totalCount - (parseInt(objectThrow.page.page));
                objectThrow.page.next = next;
                objectThrow.data.push(newArray);
                res.send(objectThrow);
                break;
            }
            else{
                if(users[x]._id == objectThrow.page.userId){
                    console.log(users[x]);
                    var paginateOffset = 0;
                    for(var y=0; y<parseInt(objectThrow.page.page); y++){
                        paginateOffset = x-y;
                        console.log(paginateOffset);
                        if(paginateOffset>=0){
                            newArray.push(users[paginateOffset]);
                            next = parseInt(paginateOffset)-1;
                        }  
                        else{
                            next = 0;
                            break;
                        }
                    }
                    objectThrow.page.next = next;
                    objectThrow.data.push(newArray);
                    res.send(objectThrow);
                    break;
                }
            }
            
        }

    });
});


router.get('/user/me', function(req,res){

    
    req.headers['x-api-key'] = req.sanitize(req.headers['x-api-key']);
    var accessCode = req.headers.authorization;
    accessCode = accessCode.replace("Bearer ", "");
    // console.log(req.user);
    // var userThrow= req.sanitize(req.user.username);
    authController.data.getUserDetails({accessCode: accessCode}, function(users){
        // var birthDay = users[0].birthDate.getFullYear()+'-'+('0'+(users[0].birthDate.getMonth()+1)).slice(-2)+'-'+('0' + users[0].birthDate.getDate()).slice(-2);
        // var newDate = new Date(birthDay);
        console.log(users[0])
        var floatBirthday = parseFloat(users[0].birthDate)
        var tempThrow = {
            "username": users[0].username,
            "first_name": users[0].firstName,
            "last_name": users[0].lastName,
            "gender": users[0].sex,
            "mobile_number": users[0].mobileNumber,
            "birthdate": floatBirthday
        }
        // var date = moment(birthDay).format('YYYY-MM-DD');
        // console.log(date)
        // var expires = moment.utc(date).valueOf();
        // console.log(expires);
        console.log(tempThrow);
        res.send(tempThrow);

    });
});

router.get("/apiSeed", function(req,res){
    api.create({apiKey: "c4b0f6409c117cd17d3c7638541c2029d642d3c9e71c6343741db45765df2a2f"}, function(err,res){
        if (err){
            console.log(err);
        } else{
            console.log(res);
        }
    })
});


//REST for Forgot Password

router.get("/forgotPassword", function(req,res){
    //Render screen to input username and embed post to forgot password
})

router.post("/auth/email/forgot", function(req,res){
    req.body.username = req.sanitize(req.body.username);
    req.headers['x-api-key']= req.sanitize(req.headers['x-api-key']);
    authController.data.checkAPIKey(req.headers['x-api-key'], function(apiValid){
        if(apiValid){
            crypto.randomBytes(16, function(err, buffer) {
                if(err){
                    res.status(400);
                    return res.send("Something went wrong in generating hash");
                }
                else{
                    var resetToken = buffer.toString('hex');
                    authController.data.editUser({username: req.body.username}, {forgotPassword: resetToken}, function(resp){
                        if(resp == "1001"){
                            res.status(401);
                            return res.send("User does not exist");
                        }
                        else{
                            authController.data.generateEmail("passwordResetEmail", req.body.username, resetToken);
                            return res.send({});
                        }
                    })
                }
            })
        } else{
            res.status(403);
            return res.send("You are not authorized to perform this action");
        }
    })
});

router.get("/forgotPassword/:id", function(req,res){
    req.params.id = req.sanitize(req.params.id);
    //RENDER Reset Password Screen and place Reset Token in POST Request
});
router.post("/forgotPassword/:id", function(req,res){
    req.params.id = req.sanitize(req.params.id);
    req.body.password = req.sanitize(req.body.password)
    user.findOne({forgotPassword: req.params.id}, function(err, usr){
        if(!usr){
            res.status(403);
            return res.send("Invalid Password Token");
        }
        else{
            usr.setPassword(req.body.password, function(err){
                usr.forgotPassword = null;
                usr.save(function(err){
                    req.logIn(usr, function(err){
                        return res.send("User Password has been Reset");
                    })
                })
            })
        }
    })
});


//REST for Signup

router.get("/backend_register", function(req,res){
    res.render("signUp.ejs");
});
router.get("/signup", function(req,res){
    req.headers['x-api-key'] = req.sanitize(req.headers['x-api-key']);
    req.query.username = req.sanitize(req.query.username);

    authController.data.checkAPIKey(req.headers['x-api-key'], function(apiValid){
        if(apiValid){
            authController.data.getUserDetails({username: req.query.username}, function(userDets){
                return res.send(userDets);
            });
        }
        else{
            res.status(403);
            return res.send("You are not authorized to view");        
        }
    })
});

router.put("/user/update", function(req,res){
    console.log(req.headers.authorization)
    var accessCode = req.sanitize(req.headers.authorization);
    // console.log(typeof(accessCode));
    if (typeof(accessCode) === "undefined"){
        res.status(401);
        res.send("Unauthorized");
    }
    else{
        accessCode = accessCode.replace("Bearer ", "");
        // req.query.username = req.sanitize(req.query.username);
        var firstName = req.sanitize(req.body.first_name);
        var lastName = req.sanitize(req.body.last_name);
        var birthDate = req.sanitize(req.body.birthdate);
        // var birthDate = new Date(birthDateS);
        var sex = req.sanitize(req.body.gender);
        var mobileNumber = req.sanitize(req.body.mobile_number);
        if((firstName==null) || (lastName==null) || (birthDate==null) || (sex==null) || (mobileNumber==null)){
            res.status(403);
            return res.send("Incomplete user details");
        }
        else{

            var objectTemp = {
                firstName: firstName,
                lastName: lastName,
                birthDate: birthDate,
                sex: sex,
                mobileNumber: mobileNumber
            }
            authController.data.checkAPIKey(req.headers['x-api-key'], function(apiValid){
                if(apiValid){
                   authController.data.editUser({accessCode: accessCode}, objectTemp, function(resp){
                        res.status(200);

                        console.log(typeof(birthDate))
                        var tempObject = {
                            username: req.body.username,
                            first_name: firstName,
                            last_name: lastName,
                            gender: sex,
                            mobile_number: mobileNumber,
                            birthdate: birthDate
                        }
                        console.log(resp);
                        res.send(tempObject);
                    })
                }
                else {
                    res.status(403);
                    return res.send("You are not authorized to access");
                }
            })
        }
    }


    
    
});

router.get("/todayDate", function(req,res){
    // var mydate = new Date();
    var today = new Date();

    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    // var str = date.toString("yyyy-MM-DD");
    console.log(date);
    res.send(date);
})

router.post("/auth/email/registration", function(req,res){
    console.log(req.headers['x-api-key']);
    req.body.username = req.sanitize(req.body.username);
    req.body.password = req.sanitize(req.body.password);
    req.body.firstName = req.sanitize(req.body.firstName);
    req.body.lastName = req.sanitize(req.body.lastName);
    req.body.birthDate = req.sanitize(req.body.birthDate);
    req.body.sex = req.sanitize(req.body.sex);
    req.headers['x-api-key'] = req.sanitize(req.headers['x-api-key']);
    req.body.mobileNumber = req.sanitize(req.body.mobileNumber);
    req.headers['x-api-key'] = req.sanitize(req.headers['x-api-key']);

    authController.data.checkAPIKey(req.headers['x-api-key'], function(apiValid){
        if(apiValid){
            authController.data.getUserDetails({username: req.body.username}, function(userDets){
                console.log(userDets);
                if(userDets == "1001"){
                    var token = "";
                    var hash = "";
                    crypto.randomBytes(16, function(err, buffer) {
                        token = buffer.toString('hex');
                        if (err){
                            res.status(400);
                            return res.send("Error Creating User");
                        }
                        else {
                            crypto.randomBytes(8, function(err, buffer) {
                                hash = buffer.toString('hex');
                                if (err) {
                                    res.status(400);
                                    res.send("Error Creating User");
                                }
                                else{
                                    authController.data.addUser(req.body.username, req.body.firstName, req.body.lastName, req.body.birthDate, req.body.sex, req.body.mobileNumber, hash, token, req.body.password, function(resp){
                                        return res.send({});
                                    });
                                }
                            });
                        }
                    });
                }
                else{
                    res.status(400);
                    return res.send("User Already Exists");
                }
            });
        }
        else {
            res.status(403);
            return res.send("You are not authorized to access");
        }
    })
});

//REST for Signin
router.post("/auth/email/login", passport.authenticate("local"), function(req, res){
    console.log("inside" + req.headers['x-api-key'])
    authController.data.checkAPIKey(req.headers['x-api-key'], function(apiValid){
        if(apiValid){
            console.log(req.body.username)
            authController.data.getUserDetails({username: req.body.username}, function(resp){
                console.log("VALID" + resp)
                if(resp[0].isValidated != "true"){
                    res.status(401);
                    return res.send("User Not Yet Validated");
                }
                else{
                    console.log(apiValid);
                    // var successRoute = "/successSignin/" + req.headers['x-api-key'];
                    authController.data.checkUserDetails(req.user.username, function(status) {
                        console.log("Check Here" + status);
                        if(status){
                            is_new_user = false;
                        }
                        else{
                            is_new_user = true;
                        }
                        var relevantData = {
                            username: req.user.username,
                            'access_token': req.user.accessCode,
                            'is_new_user': is_new_user
                        };
                        if (!is_new_user){
                            relevantData = {
                                username: req.user.username,
                                'access_token': req.user.accessCode,
                                'is_new_user': is_new_user,
                                "user" : {
                                    "first_name": req.user.firstName,
                                    "last_name": req.user.lastName,
                                    "birthdate": req.user.birthDate,
                                    "sex": req.user.sex,
                                    "mobile_number": req.user.mobileNumber
                                }
                            }
                        }
                        console.log("-----------------------------------------")
                        return res.send(relevantData);
                    })
                }
            })
            
        }
        else {
            res.status(403);
            return res.send("You are not authorized to access");
        }
    })
        
    
});

router.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
});




//Middleware
router.get("/successSignin/:id", function(req,res){
    console.log("in route")
    console.log(req.params.id)
    if (typeof req.params.id === 'undefined'){
        return res.send("You are not authorized to access!");
    } else {
        req.headers['x-api-key'] = req.sanitize(req.headers['x-api-key']);
        console.log(req.user)
        authController.data.checkUserDetails(req.user.username, function(status) {
            console.log("Check Here" + status);
            if(status){
                is_new_user = false;
            }
            else{
                is_new_user = true;
            }
            var relevantData = {
                username: req.user.username,
                'access_token': req.user.accessCode,
                'is_new_user': is_new_user
            };
            if (!is_new_user){
                relevantData = {
                    username: req.user.username,
                    'access_token': req.user.accessCode,
                    'is_new_user': is_new_user,
                    "user" : {
                        "first_name": req.user.firstName,
                        "last_name": req.user.lastName,
                        "birthdate": req.user.birthDate,
                        "sex": req.user.sex,
                        "mobile_number": req.user.mobileNumber
                    }
                }
            }
            return res.send(relevantData);
        })
    }
});
router.get("/activate/:id", function(req, res){
    authController.data.activateUser(req.params.id, function(resp){
          return res.send(resp)
    });
})



//===============Facebook Authentication

router.get('/auth/social', passport.authenticate('facebook', {scope: ['email']}));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/facebookDetails',
                                      failureRedirect: '/auth/social' }));

// router.get('/auth/facebook/callback',
//   passport.authenticate('facebook', {failureRedirect: "/"}, function(req, res){
//     if (err){
//         console.log("Invalid Facebook Login")
//     }
//     else{
//         var is_new_user;
//         console.log(req)
//         authController.data.checkUserDetails(req.user.username, function(status) {
//             //place access token fix here
//             console.log(status);
//             if(status){
//                 is_new_user = false;
//             }
//             else{
//                 is_new_user = true;
//             }
//             var throwObject = {
//                 // "access_token": req.user.facebook.token,
//                 "access_token": req.user.accessCode,
//                 "is_new_user": is_new_user
//             }
//             res.send(throwObject);
//         })
//     }
// })


router.get("/facebookDetails", function(req,res){
    var is_new_user;
    authController.data.checkUserDetails(req.user.username, function(status) {
        //place access token fix here
        console.log(status);
        if(status){
            is_new_user = false;
        }
        else{
            is_new_user = true;
        }
        var throwObject = {
            // "access_token": req.user.facebook.token,
            "access_token": req.user.accessCode,
            "is_new_user": is_new_user
        }
        res.send(throwObject);
    })
})


router.post("/removeUser", function(req,res){
    req.body.username = req.sanitize(req.body.username);
    req.headers['x-api-key'] = req.sanitize(req.headers['x-api-key']);
    authController.data.checkAPIKey(req.headers['x-api-key'], function(apiValid){
        if(apiValid){
            authController.data.removeUser(req.body.username, function(resp){
                if(resp=="1000"){
                    res.status(400);
                    res.send("1000");
                } else{
                    res.send(resp);
                }
            });
        } else{
            res.status(403);
            return res.send("You are not authorized to perform this action");
        }
    })
})




function isLoggedIn (req, res, next) {
    if (req.isAuthenticated()){
        return next();
    }
    res.send(req.user);
}





module.exports = router;