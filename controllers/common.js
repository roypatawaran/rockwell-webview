var express = require("express");
var moment = require("moment");
var router = express.Router();
var user = require("../models/user.js");
var passport = require("passport");
var crypto = require("crypto");
var api = require("../models/api.js");
const nodemailer = require('nodemailer');
var authController = require("./controllers/authentication.js");

var methods = {};

function isEmptyObject(obj) {
  return !Object.keys(obj).length;
};

methods.paginate = function(array, id, number){
    var objectThrow = {
        page:{
            userId: String,
            page: String,
            next: String
        },
        data: []
    }
    if(typeof id == 'undefined'){
        objectThrow.page.userId = "";
    }
    else{
        objectThrow.page.userId = id;
    }

    if(typeof req.query.paginate == 'undefined'){
        objectThrow.page.page = 10;
    }
    else{
        objectThrow.page.page = number
    }

    console.log(objectThrow.page.userId);
    console.log(objectThrow.page.page);

    var newArray = [];
    authController.data.getUserDetails({}, function(users){
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
}

exports.data = methods;