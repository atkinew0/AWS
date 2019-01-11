const mongoose = require('mongoose');
const { Schema } = mongoose;

const srsSchema = new Schema({
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


})

const DBEntry = mongoose.model('srs', srsSchema);

module.exports = DBEntry;