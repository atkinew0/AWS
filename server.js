

//const PORT = require('./config').PORT;
const fs = require('fs')
const express = require('express');
const app = express();
const argv = require('yargs').argv;
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const keys = require('./config/keys.js');
const Question = require('./models/level');
const DBEntry = require('./models/srs');
const cors = require('cors');
const { Schema } = mongoose;
const Docker = require('dockerode');

const port = process.env.PORT || 8081;

var socket = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
var stats  = fs.statSync(socket);

if (!stats.isSocket()) {
  throw new Error('Are you sure the docker is running?');
}

var docker = new Docker({ socketPath: socket });
var optsc = {
  'Hostname': '',
  'User': '',
  'AttachStdin': true,
  'AttachStdout': true,
  'AttachStderr': true,
  'Tty': true,
  'OpenStdin': true,
  'StdinOnce': false,
  'Env': null,
  'Cmd': ['bash'],
  'Dns': ['8.8.8.8', '8.8.4.4'],
  'Image': 'ubuntu',
  'Volumes': {},
  'VolumesFrom': []
};

var previousKey,
    CTRL_P = '\u0010',
    CTRL_Q = '\u0011';

var terminals = {}, logs = {};
var containers = []

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


// app.use(function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Headers', 'X-Requested-With');

//   let origin = req.get('origin');
//   let host = req.get('host');
//   let foundOrigin = ALLOWED_ORIGINS.find(o => (origin && origin.indexOf(o) >= 0));
//   let foundHost = ALLOWED_ORIGINS.find(h => (host && host.indexOf(h) >= 0));

//   if (!foundOrigin && !foundHost) {
//     res.status(403);
//     res.send('Go away!');
//     res.end();
//     return;
//   }
//   next();
// });

app.use('/', express.static(__dirname + '/../build'));

mongoose.connect(keys.mongoCredentials);

require('express-ws')(app);

app.get("/", function(req,res){
  res.send("Up");
});

app.get("/api/level/:levelnum", function(req,res) {
  const levelnum = parseInt(req.params.levelnum);

  console.log("/api/level/:level get route hit level",levelnum);

  Question.find({level:levelnum}).sort('id').exec(function(err, document){
    if(err) console.log(err);
    console.log("Sorted questions",document)
    res.send(document);
  });

  // Question.find({level:levelnum}, function(err, questions){
  //   if(err) console.log("Mongo error",err);
  //   console.log(questions);
  //   res.send(questions);
  //   //here want to send back the questions as json to the react component that fetched it
  // });
  
});

app.get('/api/srs',function(req,res){
  //get all questions from srs collection then filter on due times already passed

  DBEntry.find({}).exec(function(err,document){

    let d = new Date();
    let now = d.getTime();

    let questionsDue = document.filter(elem => {
      return elem.due < now;
    })
    console.log("Found",questionsDue.length," questions due already")
    res.send(questionsDue);
  });

})

app.put("/api/srs",function(req,res){
  //route used to update due times in SRS database based on correctly or incorrectly answered questions

  DBEntry.update({id:req.body.id},
    { $set: {due:req.body.due, daysTillDue:req.body.daysTillDue, repetitions:req.body.repetitions}})
    .catch(err => console.log(err));
    }

);

app.post("/api/srs", function(req,res) {
  const levelNum = parseInt(req.params.levelnum);
  console.log("Hit post for db insertion");
  console.log(req.body);

  let nextId = 0;
  
  //always get current highest question id for that level in the DB so we can add next id
DBEntry.find({}).sort('-id').exec(function(err, document){
  console.log("Found the latest id doc ",document);
  if(document.length > 0){
    nextId = document[0].id +1;
  }else{
    nextId = 0;
  }
  console.log("Next id is",nextId);
  console.log("creating db entry with due",req.body.due);
  console.log("With answer2",req.body.answer2)

 DBEntry.create(
        {
          id: nextId,
          prompt:req.body.prompt,
          answer:req.body.answer,
          answered:false,
          answer2:"@@@@",
          due:req.body.due,
          daysTillDue:req.body.daysTillDue,
          repetitions:req.body.repetitions
          
        }
      ).then(question => {
        res.json(question);
      });
  
});

  
});

function resize (container) {
  var dimensions = {
    h: process.stdout.rows,
    w: process.stderr.columns
  };

  if (dimensions.h != 0 && dimensions.w != 0) {
    container.resize(dimensions, function() {});
  }
}

// Exit container
function exit (stream, isRaw) {
  process.stdout.removeListener('resize', resize);
  process.stdin.removeAllListeners();
  //process.stdin.setRawMode(isRaw);
  process.stdin.resume();
  stream.end();
  //process.exit();
}

app.post('/terminals', function (req, res) {

  console.log("terminals post route was hit to start new container")

  let conNumber = 0;


  function handler(err, container) {

    if(err){
      console.log("Dockerode ERROR:",err);
    }

    var attach_opts = {stream: true, stdin: true, stdout: true, stderr: true};
  
    containers.push(container)
    conNumber = containers.length - 1;
    if(!container){
      console.log("Container not found",container)
    }else{
    container.attach(attach_opts, function handler(err, stream) {
      // Show outputs
      // stream.pipe(process.stdout);
  
      // // Connect stdin
      //var isRaw = process.isRaw;
      // process.stdin.resume();
      // process.stdin.setEncoding('utf8');
      // process.stdin.setRawMode(true);
      // process.stdin.pipe(stream);
  
      // process.stdin.on('data', function(key) {
      //   // Detects it is detaching a running container
      //   if (previousKey === CTRL_P && key === CTRL_Q) exit(stream, isRaw);
      //   previousKey = key;
      // });
  
      container.start(function(err, data) {
        resize(container);
        process.stdout.on('resize', function() {
          resize(container);
        });
  
        container.wait(function(err, data) {
          var isRaw = process.isRaw;
          exit(stream, isRaw);
        });
      });

      res.send(conNumber.toString())
    });
  
  }
  
  }

  if(containers.length > 5){
    console.log('Err max 5 containers allowed open per node server')
  }else{
    docker.createContainer(optsc, handler);

  }

  
  

  
});

// app.post('/terminals/:pid/size', function (req, res) {
//   let pid = parseInt(req.params.pid, 10);
//   let cols = parseInt(req.query.cols, 10);
//   let rows = parseInt(req.query.rows, 10);
//   let term = terminals[pid];

//   term.resize(cols, rows);
//   console.log('Resized terminal ' + pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
//   res.end();
// });

app.ws('/terminals/:pid', function (ws, req) {

  let container = containers[parseInt(req.params.pid)];
  let attach_opts  = {stream: true, stdin: true, stdout: true, stderr: true};
  
  if(container){
    container.attach(attach_opts, (err, stream) => {

        stream.on('data',(chunk)=>{
            //console.log("stream got data, sending to ws",chunk.toString())

            ws.send(chunk.toString());
        })

        ws.on('message',(msg)=> {
            //console.log("got a message from ws",msg.toString())
            stream.write(msg.toString())
        })

        let pinger = setInterval(() => ws.ping("heartbeat"), 10000);

        ws.on('close', function () {
          container.kill();
          clearInterval(pinger);
          console.log('Closed terminal ' + req.params.pid);
          // Clean things up
          //this line may be wrong need to test
          containers[container] = null;
          
        });

    })
  }else{  
    console.log("Container not found")
  }

  ws.send("Opened websocket connection, type a command to begin");


});

app.listen(port, () => console.log("App listening on ",port))


