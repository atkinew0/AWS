var fs = require('fs');
var path = require('path');
var commandsJson = require('./cObj.json');

var commandsFile = './commands.txt'


module.exports = {
    
    buffer: [],
    cList: {},
    score: 0,
    commands: {},
    
    
    init: function(){
        
        var cString;
        var fileLocation = path.join(__dirname, commandsFile);
        this.commands = commandsJson
        console.log("Commands",this.commands);
        
    },
    
    
    addChar: function (char){
        //add character to the buffer unless a control char
       
            this.buffer.push(char);
        
        
    },
    
    printBuffer: function(){
        console.log(this.buffer);
    },
    repeat: function(){
        return this.buffer;
    },

    checkCommand: function(elem){
        elem = elem.replace(/[\n\r\t]/g,)
        if(this.commands[elem]) return elem;
        return false;
    },
    
    clear: function(){
        this.buffer = [];
    },

    check: function(textInput){

        let tokens = textInput.split(" ");
        console.log("Got tokens of ",tokens," in check");

        //returns the first matching linux command in tokens array
        for(let i =0; i < tokens.length; i++){
            if (this.commands[tokens[i]]){
                return tokens[i];
            }
        }

        return false;

    },
    
    checkBuffer: function(){
        
        if(this.buffer.indexOf("\r") >= 0){
            // if we have an endline kind of tokenize buffer array eg ['l','s',' ','\r']   ->   'ls \r'   ->   ['ls',' ','\r']
            var tempBuffer = this.buffer.slice(0,this.buffer.length-1);
            var ret = ""
            var split = tempBuffer.join("").split(" ");
            console.log(tempBuffer.join());
            console.log("Got endline and tokenized to " + split);
            
            split.forEach(elem => {
                console.log("Running a check against clist for (command?)",elem);
                console.log(this.commands[elem]);
                if(this.commands[elem]){
                    console.log("Found valid command "+ elem);
                    this.buffer = [];
                    this.score++;
                    console.log("Score "+ this.score);
                    ret = elem;
                }   
            });
            
            this.buffer = [];
            return ret;
        }
        
    }
    
    
};


