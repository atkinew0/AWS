const mongoose = require('mongoose');
const { Schema } = mongoose;


const questionSchema = new Schema({
    id:{
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

    },
    answered:{
      type:Boolean,
      required:true
    },
    level:{
      type:Number,
      required:true
    }
});

const Question = mongoose.model('levels',questionSchema);

module.exports = Question;
//wont overwrite existing collections, just add if it does not exist
//const mongoLevel = mongoose.model('question', questionSchema);
