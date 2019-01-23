
const fs = require('fs')
const express = require('express');
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

const app = express();
require('express-ws')(app);


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', express.static(__dirname + '/../build'));


//mongoose.connect(keys.mongoCredentials);

app.use(require('./routes/auth'));
app.use(require('./routes/database'));
app.use(require('./routes/terminal'));


//Route for AWS Health Check
app.get("/", function(req,res){
  res.send("Up");
});


app.listen(port, () => {
  //stopContainers();
  console.log("App listening on ",port)

});



