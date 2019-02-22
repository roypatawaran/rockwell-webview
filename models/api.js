var mongoose = require("mongoose");

var apiSchema = new mongoose.Schema({
	apiKey: String
});

module.exports = mongoose.model("api", apiSchema);