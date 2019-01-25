const express = require('express');
const router = express.Router();
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;

const mongoose = require('mongoose');
const keys = require('../config/keys');
const Question = require('../models/level');
const DBEntry = require('../models/srs');
const User = require('../models/user');
const { Schema } = mongoose;

const requireAuth = passport.authenticate('jwt', {session: false});


mongoose.connect(keys.mongoCredentials || process.env.mongoCredentials);


router.get("/api/level/:levelnum", requireAuth, function(req,res) {
    const levelnum = parseInt(req.params.levelnum);
  
    Question.find({level:levelnum}).sort('id').exec(function(err, document){
      if(err) console.log(err);
      res.send(document);
    });
    
});
  
router.get('/api/srs', requireAuth, function(req,res){
    //get all questions from srs collection then filter on due times already passed
     let uid = req.query.uid;
     
      User.findOne(ObjectID(uid), function(err, results){
        if( err)
          console.log(err)

        let now = new Date().getTime();

        let questionsDue = results.questions.filter(elem => {
          return elem.due < now;
        })

        res.send(questionsDue);

      })
  
    // DBEntry.find({}).exec(function(err,document){
  
    //   let d = new Date();
    //   let now = d.getTime();
  
    //   let questionsDue = document.filter(elem => {
    //     return elem.due < now;
    //   })
      
    //   res.send(questionsDue);
    // });
  
})
  
router.put("/api/srs",function(req,res){
    //route used to update due times in SRS database based on correctly or incorrectly answered questions
    console.log("The req body in put route",req.body)
    User.updateMany(
     { "_id": ObjectID(req.body.uid),
      "questions.id": req.body.id
    },
    { $set: {"questions.$.due":req.body.due, "questions.$.daysTillDue" :req.body.daysTillDue, "questions.$.repetitions":req.body.repetitions}})
      .catch(err => console.log(err));
    }
      
  
    // DBEntry.update({id:req.body.id},
    //   { $set: {due:req.body.due, daysTillDue:req.body.daysTillDue, repetitions:req.body.repetitions}})
    //   .catch(err => console.log(err));
    //   }
  
);


router.post("/api/srs", function(req,res) {
    //route used when adding entries to remember
    const levelNum = parseInt(req.params.levelnum);
    
    console.log(req.body);

    User.findOne(ObjectID(req.body.uid),{"numQuestions":1}, function(err, results){
      console.log("Next question",results,results.numQuestions+1);

      let nextQuestion = results.numQuestions + 1;

      let newQuestion = {
        id: nextQuestion,
        prompt:req.body.prompt,
        answer:req.body.answer,
        answered:false,
        answer2:"@@@@",
        due:req.body.due,
        daysTillDue:req.body.daysTillDue,
        repetitions:req.body.repetitions

      }


      User.update({'_id': ObjectID(req.body.uid)}, { $push: { "questions": newQuestion } }, function(err, results){
        

          User.update({'_id': ObjectID(req.body.uid)}, { $set : { "numQuestions": nextQuestion }},function(err,results){
            

            res.status(200).send();
          });
      })


    })
  
    
});
  
  

module.exports = router;

