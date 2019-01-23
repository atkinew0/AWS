const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');

//define model
const userSchema = new Schema({
    email: { type: String, unique: true, lowercase: true},
    password: String,
    questions: [
        { id:{
            type:Number,
            required:true
          },
          prompt:{
            type:String,
            required:true
          },
          answer:{
            type:String,
            required:true
          },
          answer2:{
            type:String,
            required:true
          },
          answered:{
            type:Boolean,
            required:true
          },
          due:{
            type:Number,
            required:true
          },
          daysTillDue:{
            type:Number,
            reqired:true
          },
          repetitions:{
            type:Number,
            required:true
          }
        }
    ]
})


userSchema.pre('save',function(next){
    const user = this;

    

    bcrypt.genSalt(2, function(err, salt){
        if(err) return next(err);

        

        bcrypt.hash(user.password, salt, null, function(err, hash){
            if(err) return next(err);
            
            user.password = hash;
            next();
        })
    })
})

userSchema.methods.comparePassword = function(candidatePassword, callback){

    bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
        if(err) return callback(err);
        else callback(null, isMatch);
    })

}

//create model class
const modelClass = mongoose.model("user",userSchema);


//export the model
module.exports = modelClass;