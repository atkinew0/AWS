
module.exports = {

checkSame(question, answer){
    //check if two linux commands are equivalent ie
    //correct for 1) different spacing 2) flags in different positions 3)flags in different order

    //get flags returned as an array ie ls -al becomes ['a','l']
    let flagsQ = this.getFlags(question);
    let flagsA = this.getFlags(answer);

    //strip flags from question because they can be in different positions and cause string mismatch
    question = this.stripFlags(question);
    answer = this.stripFlags(answer);

    

    let flagsMatch = false;

    if(flagsQ.length !== flagsA.length){
        flagsMatch = false;
    }else{
            flagsMatch = flagsA.every(flag => {
            return flagsQ.includes(flag);
        });
    }
    

    if(answer === question && flagsMatch )
        return true;
    else
        return false;
    


},


stripFlags(command){

    command = command.split(" ").filter(elem => {
        return elem.charAt(0) !== "-"
    });

    //strip unnecessary spaces
    
    command = command.filter(elem => elem != "");
    
    command = command.join(" ");

    return command;

},

 getFlags(command){

    console.log('Getting flags for',command)
    let flags = []
    let tokens = command.split(" ");
    

    let flagTokens = tokens.filter(token => {
        return token.charAt(0) === "-";
    })
    

    //remember to handle both unix -al and gnu style --help flags
    flagTokens.forEach(token => {
        if(token.indexOf("--") > -1){
            flags.push(token.substring(2));
        }else{
            let split = token.split("");
            split.forEach(flag => {
                if(flag !== "-")
                    flags.push(flag)
            })
        }
    })
    
    return flags;

}

}



console.log(module.exports.checkSame("cd ~","cd g"))