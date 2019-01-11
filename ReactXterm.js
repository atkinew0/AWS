/* eslint-disable no-use-before-define */
import React from 'react';
import WordBox from './WordBox';
import ControlBox from './ControlBox';
import Prompt from './Prompt';
import PropTypes from 'prop-types';
import { Terminal } from 'xterm';
import TimeDue from './timedue.js'
import CheckSame from './checkSame.js';
// import * as attach from 'xterm/lib/addons/attach/attach';
import * as attach from './addons/attach';
import * as fit from 'xterm/lib/addons/fit/fit';
import * as fullscreen from 'xterm/lib/addons/fullscreen/fullscreen';
import * as search from 'xterm/lib/addons/search/search';
import * as winptyCompat from 'xterm/lib/addons/winptyCompat/winptyCompat';

import { runInThisContext } from 'vm';
import { puts } from 'util';

var parser = require('./parseCom')
parser.init();

//import getId from '../helpers/getId';

Terminal.applyAddon(attach);
Terminal.applyAddon(fit);
Terminal.applyAddon(fullscreen);
Terminal.applyAddon(search);
Terminal.applyAddon(winptyCompat);

const PORT = '3001';
const HOST = `127.0.0.1:${ PORT }`;
const SOCKET_URL = `ws://${ HOST }/terminals/`;

const containerStyle ={
  position: 'absolute',
    top: '50%',
    left: '50%',
    marginRight: '-50%',
    marginTop: '60px',
    transform: 'translate(-50%, -50%)'
}

//todo refactor levels elsewhere to not clutter reactxterm
//also poss to get dynamically from DB but seems just as well to hardcode levels for now
const levels = []
const MAX_LEVEL = 31
const MAX_DISPLAY = 23
const MAX = Math.min(MAX_DISPLAY, MAX_LEVEL)

for(let i = 0; i < MAX; i++){
  levels.push({name:`Level ${i+1}`,number:i+1, finished:false, selected:false})
}


export default class ReactTerminal extends React.Component {
  constructor(props) {
    super(props);

    this.buffer = [];

    this.elementId = `terminal_1`;
    this.failures = 0;
    this.interval = null;
    this.fontSize = 16;

    this.state = {
      lastEntry:"",
      command: [],
      prompt:":",
      promptColor:'#202020',
      questions: [],
      levels:levels,
      nextQuestion:0,
      mode:'',
      score:0
    };
  }

  componentDidMount() {
    this.term = new Terminal({
      cursorBlink: true,
      rows: 44,
      fontSize: this.fontSize
    });

    this.term.open(document.getElementById('terminal-container'));
    this.term.winptyCompatInit();
    this.term.fit();
    this.term.focus();
    
    // this.term.on('resize', ({ cols, rows }) => {
    //   if (!this.pid) return;
    //   fetch(`http://${ HOST }/terminals/${ this.pid }/size?cols=${ cols }&rows=${ rows }`, { method: 'POST' });
    // });
    this.term.on('key', (key) => {
      
      let command;
      

      if( key.charCodeAt(0) === 127){
        //implement backspace textarea input deletion
        let currentText = this.term.textarea.value;
        
        if(currentText.length > 0){
          currentText = currentText.slice(0,-1);
        }

        this.term.textarea.value = currentText;
        

      }

      if(key.charCodeAt(0) === 13){
        
        if(this.term.textarea.value === "next" && this.state.mode != ""){
          
          this.setState({nextQuestion:this.state.nextQuestion+1}, this.updatePrompt);
        }

        if(this.term.textarea.value === "hint" && this.state.mode!= ""){
          let hint = this.state.questions[this.state.nextQuestion].answer;
          
          this.term.write("  "+hint);
          this.setState({score:this.state.score -1});
          console.log("Hint state", this.state.questions[this.state.nextQuestion].answer)
        }

        if(this.state.mode === 'levels' || this.state.mode === 'srs'){
          //only check answer if there are questions loaded
          this.checkAnswer(this.term.textarea.value);
        }

        command = parser.check(this.term.textarea.value);
        console.log("!Checking textarea",this.term.textarea.value)
        console.log("Command returned as legit linux comand",command);
        

        if(command){

          this._makeCommand(command);
          // console.log("Command true so update",command)
          // let commandObject = { 
          //                       command: command,
          //                       typed: this.term.textarea.value       };

          //  if(!this.state.command.includes(commandObject)){
          //    this.setState( {command: [...this.state.command, commandObject] });
          //  }
        }

        this.term.textarea.value ="";

        //this.term.writeln("echo !!");
        // setTimeout(() => this.term._sendData("echo !!\r", 100));
        // setTimeout(() => {
        //   comm = this.term._getCommand();
        //   console.log("Command in ReactXterm of ", comm);
        //   command  = parser.checkCommand(comm);
          
        //   console.log('Checkcommand returned', command);

        //   if(command){
            
        //     let commandObject = { command: command,
        //     typed: parser.repeat().join("") };

        //     console.log("Command obj putitng into state", commandObject);
            
        //     if(!this.state.command.includes(commandObject)){
             
        //       this.setState( { command: [...this.state.command, commandObject] } );
        //     }
            
        //   }
        //   parser.clear();
        // }, 500);
        
        
      }
      
      //console.log("Command after checkBuffer",command);
     
    });

    this.term.decreaseFontSize = () => {
      this.term.setOption('fontSize', --this.fontSize);
      this.term.fit();
    };
    this.term.increaseFontSize = () => {
      this.term.setOption('fontSize', ++this.fontSize);
      this.term.fit();
    };
    this._connectToServer();

    // listenToWindowResize(() => {
    //   this.term.fit();
    // });
    this.term.fit();

    // this.term._core.register(this.term.addDisposableListener('key', (key, ev) => {
    //   const printable = !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey;
  
    //   if (ev.keyCode === 13) {
    //     this.term.prompt();
    //   } else if (ev.keyCode === 8) {
    //    // Do not delete the prompt
    //     if (this.term.x > 2) {
    //       this.term.write('\b \b');
    //     }
    //   } else if (printable) {
    //     this.term.write(key);
    //   }
    // }));
  
    // this.term._core.register(this.term.addDisposableListener('paste', (data, ev) => {
    //   this.term.write(data);
    // }));
    // this.term.on('key',function(key){
    //   console.log("Term got a key event");
    //   this.term.write(key);
    // })

    // this.term.textarea.onkeydown = e => {
    //   console.log(e.keyCode, e.shiftKey, e.ctrlKey, e.altKey);
    //   // ctrl + shift + metakey + +
    //   if ((e.keyCode === 187 || e.keyCode === 61) && e.shiftKey && e.ctrlKey && e.altKey) {
    //     this.term.setOption('fontSize', ++this.fontSize);
    //     this.term.fit();
    //   }
    //   // ctrl + shift + metakey + -
    //   if ((e.keyCode === 189 || e.keyCode === 173) && e.shiftKey && e.ctrlKey && e.altKey) {
    //     this.term.setOption('fontSize', --this.fontSize);
    //     this.term.fit();
    //   }
    //   // ctrl + shift + metakey + v
    //   if (e.keyCode === 86 && e.shiftKey && e.ctrlKey && e.altKey) {
    //     this.props.options.splitVertical && this.props.options.splitVertical();
    //   }
    //   // ctrl + shift + metakey + h
    //   if (e.keyCode === 72 && e.shiftKey && e.ctrlKey && e.altKey) {
    //     this.props.options.splitHorizontal && this.props.options.splitHorizontal();
    //   }
    //   // ctrl + shift + metakey + w
    //   if (e.keyCode === 87 && e.shiftKey && e.ctrlKey && e.altKey) {
    //     this.props.options.close && this.props.options.close();
    //   }
    // };
  }
  componentWillUnmount() {
    clearTimeout(this.interval);
  }

  flashPrompt(correct){
    if(correct){
      this.setState({promptColor:'green'});
    }
    else{
      this.setState({promptColor:'red'});
    }

    setTimeout(() => { this.setState({promptColor:'#202020'} ) }, 250);
  }

  handleQuestions = (questionsArray) => {
    //this will be called from controlbox which does a db query to get questions
    //and load in a level
    let levelSelected;
    if(questionsArray){
      levelSelected = questionsArray[0].level;
    }
    
    let levels = this.state.levels.map(elem => {
      if (elem.number == levelSelected)
          elem.selected = true;
      else
          elem.selected = false;
      return elem;
    });
    if(questionsArray.length > 0){
      this.setState({levels:levels});

      this.setState({nextQuestion: 0});
      this.setState({questions:questionsArray, mode:"levels"}, this.updatePrompt);
    }
    
  }

  handleSRS = (questionsArray) => {

    if(questionsArray.length == 0){
      console.log("No questions due found")
      this.setState({prompt:"No questions due for review"},() => {setTimeout(() => this.setState({prompt:"prompt"}), 2000)})
      
    }else{
      this.setState({questions:questionsArray}, () => {this.updatePrompt(); this.setMode("srs")});
    }


  }

  updatePrompt(){
    //sets the top prompt to be whatever the next question in this.state.questions is
    let questions = this.state.questions;
    
    if(this.state.questions.length == 0){
      return;
    }
    //console.log("Next question",this.state.nextQuestion," and ",questions.length)

    if(this.state.nextQuestion >= questions.length && questions.length > 0){
      this.setState({prompt:"Level Complete!",questions:[],nextQuestion:0, mode:''});

      let currentLevel = this.state.questions[0].level;
      let levels = this.state.levels.map(elem =>{
        if(elem.number == currentLevel)
          elem.finished = true;

        return elem;
      });
      this.setState({levels:levels});
      
    }else{

      this.setState({prompt:questions[this.state.nextQuestion].prompt});
    }

  }

  checkAnswer(answer){

    if(this.state.mode !== 'levels' && this.state.mode !== 'srs') return;
   
    console.log("Console logging textarea", this.term.textarea.value);
    //answer = answer.replace(pattern," ");
    console.log("checking answer", answer, " id question",this.state.questions[this.state.nextQuestion].answer)
    let questions = this.state.questions;
    let correct = false;

    let correct1 = questions[this.state.nextQuestion].answer;
    let correct2 = questions[this.state.nextQuestion].answer2;

    if(CheckSame.checkSame(correct1,answer) || CheckSame.checkSame(correct2,answer)){

      correct = true;
      questions[this.state.nextQuestion].answered = true;
      
      if(this.state.mode === 'srs'){
        this.updateDue(questions[this.state.nextQuestion], correct)
      }

      this.setState({questions:questions, nextQuestion: this.state.nextQuestion + 1, score:this.state.score + 5}, this.updatePrompt);
    }else{
      if(this.state.mode === 'levels'){
        this.setState({score:this.state.score -1});
      }

      if(this.state.mode === 'srs'){
        
        this.updateDue(questions[this.state.nextQuestion], correct)
      }
    }
    
    this.flashPrompt(correct);

  }

  updateDue(question, correct){

    console.log("Question we are about to update",question)
    
    let dueObj = TimeDue.update(question,correct);
    let repetitions = correct ? question.repetitions + 1 : 0;

    console.log(dueObj)

    let theBody = {
      id:question.id,
      due:dueObj.timeDue,
      daysTillDue:dueObj.futureDays,
      repetitions: repetitions
    }


    //fetch(`http://${HOST}/api/srs`, {method:'PUT', body:theBody});
    let theReq = `http://${HOST}/api/srs`;

    fetch(theReq, {
      body: JSON.stringify(theBody), // data can be `string` or {object}!
      headers:{
      'Content-Type': 'application/json'
      },
      method:'PUT'}).then( res => {
      if(!res.ok) console.log(res.status);

      res.text().then(resText => {
          console.log(resText);
          
      });

    })

  }

  focusTerm =() => {
    this.term.focus();
  }

  locked = () => {

    let oldPrompt = this.state.prompt;
    console.log("About to reset the prompt herenow")

    this.setState({prompt:"Locked"}, () => { setTimeout(() => this.setState({prompt:oldPrompt}), 500)})
  }

  stop = () => {
    console.log("Stopping reviewing")
    //to quit a level or srs reviewing
    this.setState({mode:"",questions:"",nextQuestion:0,prompt:":"})
  }

  setMode = (mode) => {
    if(this.state.mode === mode){
      console.log("Attempting to set state to",mode, " it is already in");
    }
    if(this.state.questions.length === 0){
      console.log("Attempting to review 0 questions");
      return;
    }

    this.setState({mode:mode});
  }

  completed(){
    return {done: this.state.nextQuestion, total:this.state.questions.length }
  }
 
  render() {

    return (
      <div style={containerStyle}>
        <Prompt color={this.state.promptColor} prompt={this.state.prompt}/>
        <WordBox stopReview={this.stop} mode={this.state.mode} completed={this.completed()} focus={this.focusTerm} setmode={this.setMode} questionsCall={this.handleSRS} lastEntry={this.state.lastEntry} words={this.state.command}/>
        <div id={"terminal-container"}  style={{
        float:'left', top: 0, left: 0, width: '80', height: '100%'
        }}></div>
        <ControlBox completed={this.completed()} score={this.state.score} locked={this.locked} levels={this.state.levels} setmode={this.setMode} focus={this.focusTerm} questionsCall={this.handleQuestions} words={this.state.levels}/>
    </div>
    )
  }



  _connectToServer() {

    const theReq = `http://${ HOST }/terminals/?cols=${ this.term.cols }&rows=${ this.term.rows }`;

    fetch(
      theReq,
      { method: 'POST' }
    ).then(
      res => {
        if (!res.ok) {
          this.failures += 1;
          if (this.failures === 2) {
            this.term.writeln(
              'There is back-end server found but it returns "' +
              res.status + ' ' + res.statusText + '".'
            );
          }
          this._tryAgain();
          return;
        }
        res.text().then(processId => {
          this.pid = processId;
          this.socket = new WebSocket(SOCKET_URL + processId);
          console.log("The socket at",SOCKET_URL+processId);
          console.log("Socket",this.socket);
          this.socket.onopen = () => {
            this.term.attach(this.socket, true , false, (comp) => { console.log("Callback" ,comp)} );
            this.term.writeln("Welcome to the beginning of mastershell");
          };
          this.socket.onclose = () => {
            this.term.writeln('Server disconnected!');
            this._connectToServer();
          };
          this.socket.onerror = () => {
            this.term.writeln('Server disconnected!');
            this._connectToServer();
          };
        });
      },
      error => {
        this.failures += 1;
        if (this.failures === 2) {
          this.term.writeln('It looks like there is no backend. You have to:');
          this.term.writeln('> npm install evala -g');
          this.term.writeln('> evala --shell=$SHELL');
        }
        console.error(error);
        this._tryAgain();
      }
    );
  }
  
  _tryAgain() {
    clearTimeout(this.interval);
    this.interval = setTimeout(() => {
      this._connectToServer();
    }, 2000);
  }

_makeCommand(command){
  //if command is new command make a new entry for that, otherwise update its typed array to hold its exact
  //input ie ls, ls-al, ls /temp etc etc...
  console.log("Command true so update",command);

  let typed = this.term.textarea.value;

  //check if entire command input is a repeat, ie already seen exact entry ls -al
  let repeat = this.state.command.some( commandObj =>  commandObj.typed === typed );

  if(!repeat){
      let seenCommand = this.state.command.some(commandObj => commandObj.command === command);

      if(!seenCommand){
          let commandObject = { 
            command: command,
            typed: [this.term.textarea.value]     };

            this.setState( {command: [...this.state.command, commandObject] });
      }
      else {
        let updateCommands = this.state.command;

        updateCommands.forEach(commandObj => {
          if(commandObj.command === command){
            commandObj.typed.push(typed);
          }
        });

        // let update = this.state.command.find(commandObj => commandObj.command === command );
        // update.typed.push(typed);
        this.setState( {command: [...updateCommands] });
      }
  }

}
};

ReactTerminal.propTypes = {
  options: PropTypes.object
};

function listenToWindowResize(callback) {
  var resizeTimeout;

  function resizeThrottler() {
    // ignore resize events as long as an actualResizeHandler execution is in the queue
    if (!resizeTimeout) {
      resizeTimeout = setTimeout(function () {
        resizeTimeout = null;
        callback();
      }, 66);
    }
  }

  window.addEventListener('resize', resizeThrottler, false);
}