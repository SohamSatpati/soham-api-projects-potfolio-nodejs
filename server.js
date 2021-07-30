// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var port = process.env.PORT || 5000;
// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require('cors');
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

app.get('/api/whoami', function (req, res) {
  console.log(req.ip);
  res.json({
    ipaddress: req.ip,
    language: req.headers['accept-language'],
    software: req.headers['user-agent'],
  });
});

// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
