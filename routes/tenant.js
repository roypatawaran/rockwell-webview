var express = require("express");
var moment = require("moment");
var router = express.Router();
// var neword = require("../models/orders.js");
var user = require("../models/user.js");
var tenant = require("../models/tenant.js");
var api = require("../models/api.js");


router.get("/tenantSeed", function(req,res){
    var strTemp = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.Why do we use it? It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).";
    tenant.create({tenantName: "wildFlour", tenantDescription: strTemp}, function(err,res){
        if (err){
            console.log(err);
        } else{
            console.log(res);
        }
    })
});

//ShopList

router.get('/shopList', function(req,res){
    var filter = req.query.filter;
    console.log(filter);
    tenant.find({filter}, function(err,tnts){
        if(err){
            res.send(err);
        }
        else{
            console.log(tnts);
            res.send(tnts);
        }
    })
});

router.get('/shopList/:filter', function(req,res){
    var type = req.params.filter;
    console.log(req.params.filter);

    //search by name
    if(req.params.filter == "n"){
        tenant.find({"tenantName": req.query.criteria}, function(err,tnts){
            if(err){
                res.send(err);
            }
            else{
                console.log(tnts);
                res.send(tnts);
            }
        }) 
    }

    //filter by id
    else if(req.params.filter == "i"){
        console.log(req.query.tId);
        tenant.find({_id: req.query.criteria}, function(err,tnts){
            if(err){
                res.send(err);
            }
            else{
                console.log(tnts);
                res.send(tnts);
            }
        })
    }

    //search description
    else if(req.params.filter == "s"){
        if (req.query.criteria) {
            const regex = new RegExp(escapeRegex(req.query.criteria), 'gi');
            tenant.find( {tenantDescription: regex }, function(err, tnts){
                if(err){
                    res.send(err);
                }
                else{
                    res.send(tnts);
                }
            })
        }
        else{
            tenant.find( {}, function(err, tnts){
                if(err){
                    res.send(err);
                }
                else{
                    res.send(tnts);
                }
            })
        }
    }
    else{
        tenant.find({}, function(err,tnts){
            if(err){
                res.send(err);
            }
            else{
                console.log(tnts);
                res.send(tnts);
            }
        })
    }    
});

//Shop Details
router.get('/shopDetails', function(req,res){

    tenant.find({_id: req.query.id}, function(err, tnts){
        if(err){
            res.send(err);
        }
        else{
            res.send(tnts);
        }
    })
});

router.put('/shopDetails', function(req,res){

});

router.post('/shopDetails', function(req,res){

});

router.post("/trialImage", function(req,res){
    if(err){
        res.send("error")
    }
    else{
        res.send(req.body.image)
    }
})


router.post("/forgotPassword/:id", function(req,res){
    req.params.id = req.sanitize(req.params.id);
    req.body.password = req.sanitize(req.body.password)
    user.findOne({'local.forgotPassword': req.params.id}, function(err, usr){
        if(!usr){
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


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



module.exports = router;