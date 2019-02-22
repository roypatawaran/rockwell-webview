var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");



var tenantSchema = new mongoose.Schema({
	tenantName: String,
	tenantType: String,
	tenantCategory: String,
	tenantLocation: String,
	tenantContactNumber: String,
	tenantDescription: String,
	tenantImage: String,
	rockwellPicks: [],
	similarPlaces: [],
	displayTags: String
	
});

module.exports = mongoose.model("tenant", tenantSchema);