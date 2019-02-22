var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var crypto = require("crypto");
var bcrypt = require("bcrypt");
// var cartProductSchema = require("../models/cartProduct.js");


var userSchema = new mongoose.Schema({
	username: String,
	signupEmail: String,
	firstName: String,
	lastName: String,
	password: String,
	birthDate: String,
	sex: String,
	mobileNumber: String,
	isValidated: String,
	accessCode: String,
	forgotPassword: String,
	facebook: {
		id: String,
		token: String,
		email: String,
		name: String
	}
	
});

userSchema.pre('save', function(next){
    var user = this;
    if (!user.isModified('password')) {
       return next()
    }

    user.password = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    next()
});

userSchema.plugin(passportLocalMongoose, {usernameField: "username"});

module.exports = mongoose.model("user", userSchema);