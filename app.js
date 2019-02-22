var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var user = require("./models/user.js");
var authRoutes = require("./routes/authentication.js");
var expressSanitizer = require('express-sanitizer');
var path = require("path");
var fs = require("fs");
var localStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var passport = require("passport");
var passportLocalMongoose = require("passport-local-mongoose");
var crypto = require("crypto");
var app = express();
var configAuth = require('./configs/FbAuth.js');
var databaseAuth = require('./configs/database.js');
var tenantRoutes = require("./routes/tenant.js");
var cors = require('cors');
var https = require('https');
var request = require('request');


// var corsOptions = {
//   origin: 'https://sandbox.paypal.com',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }

app.use(cors({credentials: true, origin: true}))


//LIFT
var paypal = require('paypal-rest-sdk');
// configure paypal with the credentials you got when you created your paypal app
paypal.configure({
  'mode': 'sandbox', //sandbox or live 
  'client_id': 'AVRhX3tWAuGCvUQWxjx6SROFd4Ha7WDPQeseLCGOt8nXofDGmMkmQGw7gxLGP7s1zyVEuqrMH7WwhG1b', // please provide your client id here 
  'client_secret': 'EEZpgGinVDah5XUI7xzqSndGRtPF3K3Aw4RkHExCadRAlmPDIKq44NrLLE04cMdoEKBwiERugHE6BB2E' // provide your client secret here 
});


exports.getJSON = function(options, onResult)
{
    console.log("rest::getJSON");

    var port = options.port == 443 ? https : http;
    var req = port.request(options, function(res)
    {
        var output = '';
        console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        //res.send('error: ' + err.message);
    });

    req.end();
};

// set public directory to serve static html files 
app.use('/', express.static(path.join(__dirname, 'public'))); 

// Add headers



//Passport declarations
app.use(require("express-session")({
    secret: "enzo yu is an awesome human being", // Edi wow. XD 
    resave: false,
    saveUninitialized:false
}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-  With, Content-Type, Accept");
    next();   
});
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(user.authenticate()));

//REFACTOR THIS CODE!
passport.use(new FacebookStrategy({
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL,
    profileFields: configAuth.facebookAuth.profileFields
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function(){
      console.log(profile.id);
      user.findOne({'facebook.id': profile.id}, function(err, usr){
        if(err){
          return done(err);
        }
        if(usr){
          console.log(usr);
          return done(null, usr);
        }
        else{
          user.find({username: profile.emails[0].value}, function(err, us){
            if(err){
              return done(err);
            }
            else if(us.length != 0){
              console.log("existing");
              user.findOneAndUpdate({username: profile.emails[0].value}, {"facebook.id": profile.id, "facebook.token": accessToken}, {new: true}, function(err,users){
                if(err){
                  return done(err)
                }
                else{
                  return done(null, users);
                }
              })
            }
            else{
              crypto.randomBytes(16, function(err, buffer) {
                hash = buffer.toString('hex');
                console.log("not existing");
                var newUser = new user();
                console.log(profile)
                newUser.facebook.id = profile.id;
                newUser.facebook.token = accessToken;
                newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                newUser.facebook.email = profile.emails[0].value;
                newUser.username = profile.emails[0].value;
                newUser.accessCode = hash;                    
                if (err) {
                    res.status(400);
                    return done(err)
                }
                else{
                    newUser.save(function(err){
                      if(err){
                        throw err;
                      }
                      else{
                        return done(null, newUser);
                      }
                    })
                }
              });
            }
          });
        }
        
      });
    })
  }
));



passport.use(user.createStrategy());


passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

//Mongo client declarations
var connectionString = "mongodb://"+databaseAuth.dbAuth.username + ":" + databaseAuth.dbAuth.password + "@" + databaseAuth.dbAuth.host + ":" + databaseAuth.dbAuth.port + "/" + databaseAuth.dbAuth.dataBase;
console.log(connectionString);
mongoose.connect(connectionString);

//Base Declarations - Use
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

//Start of Routes
// app.use(authRoutes);
// app.use(tenantRoutes);

app.get('/procure/:token' , (req , res) => {
    var token = req.params.token;
    console.log(token);
    res.render('index.ejs',{
      token : token
  }); 
})



//LIFT
app.post('/buy/:token' , ( req , res ) => {
  console.log(req.body)
  var total = computationFinal(req.body.quant[0], req.body.quant[1], req.body.quant[2])
  res.setHeader('Access-Control-Allow-Origin','*');
  // create payment object 
    var payment = {
            "intent": "authorize",
  "payer": {
    "payment_method": "paypal"
  },
  "redirect_urls": {
    "return_url": "https://rockwell-mobile.herokuapp.com/success/v1/apppurchase/success/" + req.params.token,
    "cancel_url": "https://rockwell-mobile.herokuapp.com/err"
  },
  "transactions": [{
    "amount": {
      "total": parseFloat(total),
      "currency": "PHP"
    },
    "description": " Rockwell E-GC "
  }]
    }
    console.log(payment.transactions[0].amount.total)
  
  
  // call the create Pay method 
    createPay( payment ) 
        .then( ( transaction ) => {
          console.log(transaction.id)
          // console.log(transaction.links)
            var id = transaction.id; 
            var links = transaction.links;
            var counter = links.length; 
            while( counter -- ) {
                if ( links[counter].method == 'REDIRECT') {
                  // console.log(transaction.id)
                  console.log(links[counter].href)
          // redirect to paypal where user approves the transaction 
                    return res.redirect( links[counter].href )
                }
            }
        })
        .catch( ( err ) => { 
            console.log( err ); 
            res.redirect('http://127.0.0.1:3000');
        });
}); 


// success page 
app.get('/success', function(req, res) {
    var paymentId = req.query.paymentId;
    var payerId = { 'payer_id': req.query.PayerID };

    paypal.payment.execute(paymentId, payerId, function(error, payment){
        if(error){
            console.error(error);
        } else {
            if (payment.state === 'approved'){ 
                res.send(paymentId);
                console.log(payment);
            } else {
                res.send('payment not successful');
            }
        }
    });
});



// error page 
app.get('/err' , (req , res) => {
    console.log(req.query); 
    res.render('err.ejs'); 
})

// app listens on 3000 port 
// app.listen( 3000 , () => {
//     console.log(' app listening on 3000 '); 
// })

app.post('/computation', function(req,res){
  var denom = [500, 1000, 5000];
  var total = 0;
  console.log(req.body)

  total = (parseInt(req.body.quant1) * denom[0]) + (parseInt(req.body.quant2) * denom[1]) + (parseInt(req.body.quant3) * denom[2])
  console.log(total)
  res.contentType('json');
  res.header("Access-Control-Allow-Origin", "*");
  // res.send({ some: JSON.stringify({response:'json'}) });
  res.json({success: total})


})

// app.get('/movies', function(req,res){
  

// })


//// CINEMAS

app.get('/movies', function(req, res) {

  request({
      url: 'https://powerplantcinema.com/api/cinetix/getSchedules',
      method: 'POST',
      json: {
        "method": null,
        "headers": {},
        "body": null,
        "url": null,
        "withCredentials": null,
        "responseType": null
      }
    }, function(error, response, body){
      console.log(body.content.length)
      var arrayOfMovies = []
      var temp = body.content
      var movies = []
      for(var x=0; x<body.content.length; x++){
        var formatData = {
          name: String,
          id: String,
          cinema: String,
          screenings: []
        }
        formatData.name= temp[x].movie_details.title;
        formatData.id= temp[x].id;
        formatData.cinema= temp[x].cinema;
        // if(typeof temp[x] === 'undefined')
        for(var y=0; y<temp[x].screening_time.length; y++){
          var screeningData = {
            id: String,
            start: String,
            status: Boolean
          }
          screeningData.id = temp[x].screening_time[y].id;
          screeningData.start = temp[x].screening_time[y].start;
          screeningData.status = temp[x].screening_time[y].status;
          formatData.screenings.push(screeningData)
        }
        arrayOfMovies.push(formatData)
      }

      // res.send(arrayOfMovies)
      res.render("availableScreenings.ejs", {data: arrayOfMovies})
      // res.send(temp)
    });
})


app.get('/generateGuest', function(req,res){
  request({
      url: 'https://powerplantcinema.com/api/session/generate/guest',
      method: 'POST',
      json: {
        "method": null,
        "headers": {},
        "body": null,
        "url": null,
        "withCredentials": null,
        "responseType": null
      }
    }, function(error, response, body){

      res.send(body)
    });

})




app.get('/seats/:id', function(req,res){
  request({
      url: 'https://powerplantcinema.com/api/cinetix/getScreeningById',
      method: 'POST',
      json: {
        "id": req.params.id
      }
    }, function(error, response, body){
      res.send(body)
    });
})

app.get('/reserveSeats/:id', function(req,res){
  var idOfSeat = req.params.id
  request({
      url: 'https://powerplantcinema.com/api/cinetix/reserveSeat',
      method: 'POST',
      json: {
        "screenId": 17250,
        "seatId": parseInt(req.params.id),
        "sessionId": "R1VFU1Q9SVA9MTI0LjYuMTg5LjI0MT1SQU49OTYxMDI0NDg="
      }
    }
    , function(error, response, body){
      res.send(body)
    });
})




  




//END LIFT



app.get("*", function(req,res){
    res.status(400);
    res.send("Access Denied");
});

// Server declaration
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Running Server in: " + process.env.IP + " PORT: " + process.env.PORT);
});

// app.listen(3003, "127.0.0.1", function(){
//     console.log("Running Server in: " + process.env.IP + " PORT: " + process.env.PORT);
// });


// helper functions 
var createPay = ( payment ) => {
    return new Promise( ( resolve , reject ) => {
        paypal.payment.create( payment , function( err , payment ) {
         if ( err ) {
             reject(err); 
         }
        else {
            resolve(payment); 
        }
        }); 
    });
}   


function computationFinal(x, y, z) {
  var denom = [500, 1000, 5000];
  var total = 0;

  total = (parseInt(x) * denom[0]) + (parseInt(y) * denom[1]) + (z * denom[2])
  return total
}



