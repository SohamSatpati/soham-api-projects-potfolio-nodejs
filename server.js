// server.js
// where your node app starts
// init project
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlpareser = require('url');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
let port = process.env.PORT || 5000;

//for localhost dbconnection
mongoose.connect(process.env['MONGO_URI'], {
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

//excerciseTracker routing
app.get('/excerciseTracker', function (req, res) {
  res.sendFile(__dirname + '/views/excercisetracker.html');
});

//fileMetadata routing
app.get('/fileMetadata', function (req, res) {
  res.sendFile(__dirname + '/views/filemetadata.html');
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
  // console.log(dateString);

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
  // console.log(req.ip);
  res.json({
    ipaddress: req.ip,
    language: req.headers['accept-language'],
    software: req.headers['user-agent'],
  });
});

////////////////////////////// Request Header Parser Microservice End///////////////////////

////////////////////////////// URL Shortener Microservice Start/////////////////////////////

//create url schema and model

const schema = new mongoose.Schema({ url: String });
const Url = mongoose.model('Url', schema);

app.post('/api/shorturl', function (req, res) {
  // console.log(req.body);
  const bodyurl = req.body.url;

  const something = dns.lookup(
    urlpareser.parse(bodyurl).hostname,
    (err, address) => {
      if (!address) {
        res.json({
          error: 'Invalid URL',
        });
      } else {
        const url = new Url({ url: bodyurl });
        url.save((err, data) => {
          res.json({
            original_url: data.url,
            short_url: data.id,
          });
        });
      }
      // console.log('dns', err);
      // console.log('address', address);
    }
  );
  // console.log('something', something);
});

app.get('/api/shorturl/:id', (req, res) => {
  const id = req.params.id;
  Url.findById(id, (err, data) => {
    if (!data) {
      res.json({
        error: 'Invalid URL',
      });
    } else {
      res.redirect(data.url);
    }
  });
});
////////////////////////////// URL Shortener Microservice End///////////////////////////////

///////////////////////////// Excercise Tracker Start //////////////////////////////////////

//create excercise Schema
const { Schema } = mongoose;
const excerciseSchema = new Schema({
  username: String,
  log: [
    {
      regdate: String,
      duration: Number,
      description: String,
    },
  ],
});

//create excercise model
let Excercise = mongoose.model('Excercise', excerciseSchema);

//Add user to the Database
app.post('/api/users', async function (req, res) {
  //first check username already exist or not
  const inputUsername = req.body.username;
  //find people by username
  try {
    let isUserExist = await Excercise.findOne({ username: inputUsername });
    // console.log('isUserExist', isUserExist);
    // console.log("called one:=",isUserExist.username);
    if (isUserExist) {
      //already exist
      res.json({
        message: 'Username already taken',
      });
    } else {
      //create a new one
      let newUser = new Excercise({ username: inputUsername });
      await newUser.save();
      console.log('Document inserted Successfully');
      res.json({
        username: newUser.username,
        _id: newUser.id,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(404).json({
      message: 'Not Found!',
    });
  }
});

//get all users from the Database

app.get('/api/users', function (req, res) {
  Excercise.find({}, function (err, users) {
    let userMap = users.map((user) => {
      return {
        _id: user._id,
        username: user.username,
      };
    });

    res.send(userMap);
  });
});

//Add excercise to the Database
app.post('/api/users/:_id/exercises', function (req, res) {
  // console.log(req.body);
  const userId = req.params._id;

  // console.log('userid', userId);
  let username = '';
  let inputDate = req.body.date;
  inputDate === ''
    ? (inputDate = new Date())
    : (inputDate = new Date(inputDate));

  let duration = Number(req.body.duration);
  let description = req.body.description;
  // console.log(
  //   'userid',
  //   userId,
  //   'date:',
  //   inputDate,
  //   'dutration',
  //   duration,
  //   'desc',
  //   description
  // );

  Excercise.findById({ _id: userId }, (err, data) => {
    console.log(data);

    if (err || data == null) {
      console.error(err);
      return res.status(404).json({
        message: 'Unknown UserID!',
      });
    } else {
      console.log('found');
      username = data.username;
      // console.log('uname', username);
      // console.log(data);

      data.log.push({
        regdate: inputDate,
        description: description,
        duration: duration,
      });
      data.save((err, updateData) => {
        if (err) {
          console.error(err);
          res.status(404).json({
            message: 'Not found!',
          });
        } else {
          console.log('Successfully Updated!');
          res.json({
            _id: userId,
            username: username,
            date: inputDate.toDateString(),
            duration: duration,
            description: description,
          });
        }
      });
    }
  });
});

//get all excercises for a perticular user

app.get('/api/users/:_id/logs', function (req, res) {
  const { from, to, limit } = req.query;
  const userId = req.params._id;
  let username = '';
  // console.log('userid', userId);
  Excercise.findById({ _id: userId }, (err, data) => {
    if (err) {
      console.error(err);
      res.status(404).json({
        message: 'Not Found!',
      });
    } else {
      // console.log('found');
      username = data.username;
      // console.log("uname",username);

      let logs = data.log;
      //  console.log("logs",logs);
      // console.log('to', to, 'from', from);

      //set the limit
      if (limit) {
        logs = logs.slice(0, +limit);
      }

      //set date from where logs will genarate
      if (from) {
        const fromDate = new Date(from);
        logs = logs.filter((exe) => new Date(exe.regdate) >= fromDate);
      }

      //set date from where logs will genarate
      if (to) {
        const toDate = new Date(to);
        logs = logs.filter((exe) => new Date(exe.regdate) <= toDate);
      }

      //fetch all logs
      let userLogs = logs.map((log) => {
        // logCount++;
        return {
          duration: log.duration,
          description: log.description,
          date: log.regdate,
        };
      });

      //console.log("log count",logCount);

      res.json({
        _id: userId,
        username: username,
        count: userLogs.length,
        log: userLogs,
      });
    }
  });
});

///////////////////////////// Excercise Tracker End ////////////////////////////////////////

//////////////////////////// File Metadata Start ///////////////////////////////////////////

app.post('/api/fileanalyse', upload.any(), function (req, res) {
  let fileUploadInfo = req.files[0];
  // console.log(fileUploadInfo);
  if (fileUploadInfo == undefined) {
    res.json({
      message: 'Choose any file',
    });
  } else {
    res.json({
      name: fileUploadInfo.originalname,
      type: fileUploadInfo.mimetype,
      size: fileUploadInfo.size,
    });
  }
});

/////////////////////////// File Metadata End //////////////////////////////////////////////

// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
