//simple SRS interval calculation function based on modified SuperMemo 2 algorithm below
/*
I(0) = 1 day
I(1) = 4 days
if n > 1 then I(n) = I(n-1) * 2 
*/

module.exports = {


    update(question, correct){

        if(correct){
            return this.calcDue(question.repetitions,question.daysTillDue);
        }else{
            return this.calcFail(question.repetitions,question.daysTillDue);
        }
    },

    //calculate the time for next SRS rep based on correct answer number of times answered correctly and past time
    calcDue(repetitions, days){
        let now = new Date();
        let scheduled, futureDays;

        //default if there is some error we still want to return something reasonable
        scheduled = now.getTime();
        futureDays = 0;

        if(repetitions === 0){
            scheduled =  now.getTime() + 86400000;
            futureDays = 1; 
        }

        if(repetitions === 1){
            scheduled =  now.getTime() + 4 * 86400000;
            futureDays = 4;
        }

        if(repetitions > 1){
            futureDays =  days * 2.2;
            scheduled = now.getTime() + futureDays * 86400000;

        }
        console.log("Answer correct, due to be repeated in", (scheduled - now.getTime())/(1000*60*60*24) + " days")
        
        return { futureDays:futureDays, timeDue: scheduled }


    },

    //resets interval to 0 for newly failed items, may be more sophisticated in the future, thus the parameters
    calcFail(repetitions,days){
        let now = new Date();

        let scheduled = now.getTime();
        console.log("Answer incorrect, question due to be repeated in", now.getTime() - scheduled + " days");

        return { futureDays:0, timeDue: scheduled}

    }


}