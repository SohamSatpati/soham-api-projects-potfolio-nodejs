// server.js
require('dotenv').config();

// where your node app starts

// init project
const express = require('express');
const mongoose = require('mongoose');
const mongo = require('mongodb');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const validUrl = require('valid-url');
const MONGODBURI =
  'mongodb+srv://soham990:eDT5IFYQFKlaWP6x@cluster0.43tlj.mongodb.net/test?retryWrites=true&w=majority';
const app = express();
let port = process.env.PORT || 5000;

//for localhost dbconnection
mongoose.connect(MONGODBURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
});

//test dbconnection successed or not
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

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
  const client_requested_url = req.body.url;
  console.log('url:=>', client_requested_url);
  let suffix = shortid.generate();
  console.log('Suffix=>', suffix);
  //check if the url is valid or not
  if (!validUrl.isWebUri(client_requested_url)) {
    res.status(401).json({
      error: 'Invalid URL',
    });
  } else {
    //check if its already in the database
    URLShortenerModel.findOne(
      { original_url: client_requested_url },
      (err, data) => {
        console.log('response from db', data);
        try {
          if (data) {
            res.json({
              original_url: data.original_url,
              short_url: data.short_url,
            });
          } else {
            //if its not exist then create new one and response the result
            //Store all key-value pairs for URLShortener schema
            let newURL = new URLShortenerModel({
              short_url: suffix,
              original_url: client_requested_url,
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
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  }
});

//short_url: __dirname + '/api/shorturl/' + suffix,

//get request for shortenURL

app.get('/api/shorturl/:short_url?', function (req, res) {
  let userGeneratedSuffix = req.params.short_url;
  //fetch URL from database matches whether this short url is valid and redirect it
  URLShortenerModel.find({ short_url: userGeneratedSuffix }).then(function (
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
