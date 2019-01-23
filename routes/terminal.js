
const express = require('express');
const fs = require('fs');
const passport = require('passport');
const router = express.Router();

const argv = require('yargs').argv;
const bodyParser = require('body-parser');
const Docker = require('dockerode');

const requireAuth = passport.authenticate('jwt', {session: false});


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


var containers = [];
var activeContainers = 0;


router.post('/terminals', requireAuth, function (req, res) {
  
    console.log("terminals post route was hit to start new container")
    
    let conNumber = 0;

    function handler(err, container) {
  
      if(err){
        console.log("Dockerode ERROR:",err);
      }
  
      var attach_opts = {stream: true, stdin: true, stdout: true, stderr: true};
    
      containers.push(container)
      activeContainers++;
      console.log("Active containers",activeContainers);
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
  
    if(activeContainers > 10){
      console.log('Err max 10 containers allowed open per node server on demo version, wait for resources to become free')
    }else{
      docker.createContainer(optsc, handler);
  
    }
  
    
  });
  
  
  router.ws('/terminals/:pid', function (ws, req) {
  
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
            console.log("Calling function on ws CLOSE")
            container.kill().catch( function(err){
              console.log(err);
            });
            clearInterval(pinger);
            console.log('Closed terminal ' + req.params.pid);
            // Clean things up
            //this line may be wrong need to test
            containers[container] = null;
          
            
          });
  
          ws.on('error',function () {
            //cleanup resources if accidental disconnect happens
            console.log("Calling function on ws ERROR")
            container.kill();
            clearInterval(pinger);
            console.log('Closed terminal due to WS error ' + req.params.pid);
  
            containers[container] = null;
            
          });
  
      })
    }else{  
      console.log("Container not found")
    }
  
    ws.send("Opened websocket connection, type a command to begin\n\n");
  
  
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
    console.log("User called exit in container, closing")
  
    process.stdout.removeListener('resize', resize);
    process.stdin.removeAllListeners();
    //process.stdin.setRawMode(isRaw);
    process.stdin.resume();
    stream.end();
    activeContainers--;
    //process.exit();
  }
  
  
  function stopContainers(){
    //stop containers which may have been left open if previous server crashed or was killed
    //in the future it might be better to have react try to reconnect to old container
    docker.listContainers(function (err, containers) {
      containers.forEach(function (containerInfo) {
        docker.getContainer(containerInfo.Id).stop();
      });
    });
  }

  module.exports = router;