var express = require("express");
var moment = require("moment");
var router = express.Router();

var user = require("../models/user.js");
var passport = require("passport");
var crypto = require("crypto");
var api = require("../models/api.js");
const nodemailer = require('nodemailer');
var moment = require('moment');

var methods = {};

function isEmptyObject(obj) {
  return !Object.keys(obj).length;
};

methods.generateEmail = function(type, email, hash){
    nodemailer.createTestAccount((err, account) => {
        let transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "enzo.yu@devboxph.com", // generated ethereal user
                pass: "Hello*10110" // generated ethereal password
            }
        });
        var subj = "";
        var inlineHtml = "";
        switch(type){
            case "passwordResetEmail":
                subj = "Rockwell Password Reset Link";
                inlineHtml = '<a href='+ '"https://rockwell-mobile.herokuapp.com/forgotPassword/'+hash +'">Reset Password</a>';
                break;
            case "activationEmail":
                subj = "Rockwell User Activation Email";
                inlineHtml = '<a>https://rockwell-mobile.herokuapp.com/activate/'+hash +'</a>';
                break;
            default:
                subj = "Rockwell User Activation Email";
                inlineHtml = '<a href='+ '"https://rockwell-mobile.herokuapp.com/activate/'+hash +'">Activate Your Account Now!</a>';
                break;
        }
        var subject

        // setup email data with unicode symbols
        let mailOptions = {
            from: 'enzo.yu@devboxph.com', // sender address
            to: email, // list of receivers
            subject: subj, // Subject line
            text: 'Hello world?', // plain text body
            html: inlineHtml // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log(info);
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));


        });
    });
};

methods.isEmptyObject = function(obj) {
  return !Object.keys(obj).length;
};

methods.checkAPIKey = function(apiKey, callback){
    if (typeof apiKey === 'undefined'){
        callback(false);
    } else{
        api.find({apiKey: apiKey}, function(err, res){
            console.log(res);
            if (err || methods.isEmptyObject(res)){
                callback(false);
            }
            else {
                callback(true);
            }
        })
    }
};

methods.getUserDetails = function(queryString, callback){
    user.find(queryString, function(err, usr){
        if (err){
            callback("1000");
        } else{
            if(methods.isEmptyObject(usr)){
                callback("1001");
            }
            else {
                callback(usr);
            }
        }
    })
};


methods.checkUserDetails = function(uname, callback){
    user.find({username: uname}, function(err, usr){
        if (err){
            callback("1000");
        } else{
            console.log((typeof(usr.firstName)=="undefined"));
            if(methods.isEmptyObject(usr)){
                callback("1001");
            }

            else {
                console.log(usr);
                if(typeof(usr[0].firstName) == "undefined" || typeof(usr[0].lastName) == "undefined" || typeof(usr[0].sex) == "undefined" || typeof(usr[0].mobileNumber) == "undefined" || typeof(usr[0].birthDate) == "undefined"){
                    callback(false);
                }
                else{
                    callback(true);
                }
                
            }
        }
    })
};


methods.activateUser = function(id, callback){
    user.findOneAndUpdate({isValidated: id}, {isValidated: 'true'}, {new: true}, function(err, usr){
        if(err){
            callback("1000");
        }
        else if (usr === null)
        {
            callback("1001");
        }
        else {
            callback(usr);
        }
    });
};

methods.removeUser = function(username, callback){
    user.deleteOne({username: username}, function(err, obj){
        if(err){
            callback("1000");
        }
        else{
            callback(username + " has been deleted");
        }
    })
};

methods.editUser = function(queryString, to, callback){
    user.findOneAndUpdate(queryString, to, {new: true}, function(err, usr){
        if(err){
            callback("1000");
        }
        else if (usr === null)
        {
            callback("1001");
        }
        else {
            callback(usr);
        }
    });
};

methods.addUser = function(username, firstName, lastName, birthDate, sex, mobileNumber, hash, token, password, callback){
    user.register(new user({username: username, firstName: firstName, lastName: lastName, birthDate: birthDate, sex: sex, mobileNumber: mobileNumber, isValidated: hash, accessCode: token}), password, function(err,User){
        if (err){
            console.log(err);
            callback("1000");
        }
        else {
            methods.generateEmail("activationEmail", username, hash);
            callback(User);
        }            
    });
};

exports.data = methods;