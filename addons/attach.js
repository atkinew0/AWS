Object.defineProperty(exports, '__esModule', { value: true });

function attach(term, socket, bidirectional, buffered, callback) {
  let command = "";

  term._getCommand = function(){
    return command;
  }

  bidirectional = (typeof bidirectional === 'undefined') ? true : bidirectional;
  term.socket = socket;
  term._flushBuffer = function () {
    term.write(term._attachSocketBuffer);
    term._attachSocketBuffer = null;
  };
  term._pushToBuffer = function (data) {
    if (term._attachSocketBuffer) {
      term._attachSocketBuffer += data;
    } else {
      term._attachSocketBuffer = data;
      setTimeout(term._flushBuffer, 10);
    }
  };
  let myTextDecoder;

  term._getMessage = function (ev) {
    let str;

    if (typeof ev.data === 'object') {
      if (ev.data instanceof ArrayBuffer) {
        if (!myTextDecoder) {
          myTextDecoder = new TextDecoder();
        }
        str = myTextDecoder.decode(ev.data);
      } else {
        throw new Error('TODO: handle Blob?');
      }
    }
    if (buffered) {
      term._pushToBuffer(str || ev.data);
    } else {
      //this is where to monkey with term writes
      //in particular by checking for the echo pattern and somehow sending command to ReactXterm
      //like maybe through a callback term.attach(socket, callback)
      
      // let tokens = ev.data.split(" ");
      // let comp = [];
      // for(let i = 0; i < tokens.length; i++){
      //   if(tokens[i].indexOf("echo") > -1 ){
      //     comp = tokens[i+1];
      //   }
      // }
      // if(comp){
      //   if(comp.indexOf("\r")> -1){
      //     comp = comp.split("\r")[0];
      //     console.log("Parsed commands to",comp);
      //     command = comp;
      //   }
      // }
      
      term.write(str || ev.data);
    }
  };
  term._sendData = function (data) {
    if (socket.readyState !== 1) {
      return;
    }
    
    let encoded = encodeURI(data);

    if (encoded === '%1B%5B1;11D') return;
    if (encoded === '%1B%5B1;11C') return;
    socket.send(data);
  };
  socket.addEventListener('message', term._getMessage);
  if (bidirectional) {
    term.on('data', term._sendData);
  }
  socket.addEventListener('close', term.detach.bind(term, socket));
  socket.addEventListener('error', term.detach.bind(term, socket));
}
exports.attach = attach;
;
function detach(term, socket) {
  term.off('data', term._sendData);
  socket = (typeof socket === 'undefined') ? term.socket : socket;
  if (socket) {
    socket.removeEventListener('message', term._getMessage);
  }
  delete term.socket;
}
exports.detach = detach;
;
function apply(terminalConstructor) {
  terminalConstructor.prototype.attach = function (socket, bidirectional, buffered) {
    return attach(this, socket, bidirectional, buffered);
  };
  terminalConstructor.prototype.detach = function (socket) {
    return detach(this, socket);
  };
}
exports.apply = apply;