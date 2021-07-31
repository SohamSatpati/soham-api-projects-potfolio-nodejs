// server.js
// where your node app starts
const dbconnURI =
  'mongodb+srv://soham990:eDT5IFYQFKlaWP6x@cluster0.43tlj.mongodb.net/test?retryWrites=true&w=majority';
// init project
const express = require('express');
const mongoose = require('mongoose');
const mongo = require('mongodb');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const app = express();
let port = process.env.PORT || 5000;

//for localhost dbconnection
mongoose.connect(dbconnURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//for production dbconnection
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
//this will stop when app is running  on localhost

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
const cors = require('cors');
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// your first API endpoint...
app.get('/api/hello', function (req, res) {
  console.log({ greeting: 'hello API' });
  res.json({ greeting: 'hello API' });
});

//requestHeader parser routing
app.get('/requestHeaderPerser', function (req, res) {
  res.sendFile(__dirname + '/views/requestHeaderPerser.html');
});

//timestamp routing
app.get('/timestamp', function (req, res) {
  res.sendFile(__dirname + '/views/timestamp.html');
});

//urlshortener routing
app.get('/urlShortener', function (req, res) {
  res.sendFile(__dirname + '/views/urlShortener.html');
});

////////////////////////////// Timestamp Microservice Start////////////////////////////////
//your empty date API
app.get('/api', function (req, res) {
  let now = new Date();
  res.json({
    unix: now.getTime(),
    utc: now.toUTCString(),
  });
});

//your valid Date API
app.get('/api/timestamp/:date_string?', function (req, res) {
  let dateString = req.params.date_string;
  console.log(dateString);

  // dateString starts with 5 digits, treat it as timestamp
  if (/^\d{5,}/.test(dateString)) {
    const timestamp = +dateString;

    return res.json({
      unix: timestamp,
      utc: new Date(timestamp).toUTCString(),
    });
  }

  // Try to convert dateString to Date object
  const dateObj = new Date(dateString);

  // Invalid format provided
  if (dateObj.toString() === 'Invalid Date') {
    return res.json({ error: 'Invalid Date' });
  }

  // Correct format, return values for given date
  return res.json({
    unix: dateObj.getTime(),
    utc: dateObj.toUTCString(),
  });
});

////////////////////////////// Timestamp Microservice End///////////////////////////////////

////////////////////////////// Request Header Parser Microservice Start/////////////////////

app.get('/api/whoami', function (req, res) {
  console.log(req.ip);
  res.json({
    ipaddress: req.ip,
    language: req.headers['accept-language'],
    software: req.headers['user-agent'],
  });
});

////////////////////////////// Request Header Parser Microservice End///////////////////////

////////////////////////////// URL Shortener Microservice Start/////////////////////////////
//create new schema for URLShortener
const { Schema } = mongoose;
const urlShortSchema = new Schema({
  short_url: String,
  original_url: String,
  suffix: String,
});

//create a model
let URLShortenerModel = mongoose.model('URLShortenerModel', urlShortSchema);

// create application/json parser
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// parse application/json
app.use(express.json());

app.post('/api/shorturl', function (req, res) {
  let suffix = shortid.generate();
  console.log(suffix);
  let client_requested_url = req.body.url;

  //Store all key-value pairs for URLShortener schema
  let newURL = new URLShortenerModel({
    short_url: __dirname + '/api/shorturl/' + suffix,
    original_url: client_requested_url,
    suffix: suffix,
  });

  //Save the data and response back to the client
  newURL.save((err, data) => {
    try {
      console.log('document inserted successfully');
      //done(null, data);
      //response to the client
      res.json({
        original_url: newURL.original_url,
        short_url: newURL.short_url,
      });
    } catch (err) {
      console.error(err);
    }
  });
});
//get request for shortenURL

app.get('/api/shorturl/:suffix', function (req, res) {
  let userGeneratedSuffix = req.params.suffix;
  //fetch URL from database matches whether this short url is valid and redirect it
  URLShortenerModel.find({ suffix: userGeneratedSuffix }).then(function (
    foundURLs
  ) {
    try {
      let urlToRedirect = foundURLs[0].original_url;
      res.redirect(`${urlToRedirect}`);
    } catch (err) {
      console.error(err);
      res.json({
        error: 'invalid url',
      });
    }
  });
});

////////////////////////////// URL Shortener Microservice End///////////////////////////////

// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
