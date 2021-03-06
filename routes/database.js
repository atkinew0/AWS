const express = require('express');
const router = express.Router();
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;

const mongoose = require('mongoose');
//const keys = require('../config/keys');
const Question = require('../models/level');
const DBEntry = require('../models/srs');
const User = require('../models/user');
const { Schema } = mongoose;

const requireAuth = passport.authenticate('jwt', {session: false});


mongoose.connect(process.env.mongoCredentials, function(err){
  if(err)
    console.log("Mongoose connection error: \n", err);
    else
    console.log("Connected to mongodb")
});


router.get("/api/level/:levelnum", requireAuth, function(req,res) {
    const levelnum = parseInt(req.params.levelnum);
  
    Question.find({level:levelnum}).sort('id').exec(function(err, document){
      if(err) console.log(err);
      res.send(document);
    });
    
});

router.get("/api/user", function(req,res){


  let { uid } = req.query;

  User.findOne(ObjectID(uid), function(err, results){
    if( err)
      console.log(err)


    res.send(results);

  });

})

router.post('/api/user',requireAuth, function(req,res){

  let {uid, level} = req.query;

  console.log("hit level completed route",req.query)

  User.updateOne({'_id': ObjectID(uid)}, {$set : { levelCompleted: level }}, function(err, results){
    if(err)
      console.log(err);
    console.log(results)

    res.status(200).send();
  })

});

router.get('/api/srs/all', requireAuth, function(req,res){

  let { uid } = req.query;

  User.findOne(ObjectID(uid), function(err, results){
    if( err)
      console.log(err)

    let now = new Date().getTime();


    res.send(results.questions);

  })


})
  
router.get('/api/srs', requireAuth, function(req,res){
    //get all questions from srs collection
     let uid = req.query.uid;
     
      User.findOne(ObjectID(uid), function(err, results){
        if( err)
          console.log(err)

        let now = new Date().getTime();

        let due = results.questions.filter(elem => {
           return elem.due < now;
       })

       let noneDue = due.length === 0 ? true : false;
        

        let questions = results.questions;

       let response = {
         questions,
         noneDue
       }

        res.send(response);

      })
  
})

router.put("/api/srs", function(req, res){

  console.log("Updating questions on database with",req.body)

  User.updateOne(
    { "_id": ObjectID(req.body.uid),
    },
    {
      $set: { "questions": req.body.questions}
    }

  ).catch(err => console.log(err))

  res.status(200).send();
})
  
// router.put("/api/srs",function(req,res){
//     //route used to update due times in SRS database based on correctly or incorrectly answered questions
//     console.log("The req body in put route",req.body)
//     User.updateMany(
//      { "_id": ObjectID(req.body.uid),
//       "questions.id": req.body.id
//     },
//     { $set: {"questions.$.due":req.body.due, "questions.$.daysTillDue" :req.body.daysTillDue, "questions.$.repetitions":req.body.repetitions}})
//       .catch(err => console.log(err));
//     }
      
  
// );


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

router.post('/api/srs/delete',requireAuth, function(req,res){

  //delete questions from users db entry based on body params

  User.updateOne({'_id': ObjectID(req.body.user)},{$pull: { questions: { id : {$in : req.body.deleteItems  } }}} ,function(err,results){
    if(err)
      console.log(err);
    else{
      res.status(200).send();
    }
    
  } )

});
  
  

module.exports = router;

