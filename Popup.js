import React from 'react';

const PORT = '3001';
const HOST = `127.0.0.1:${ PORT }`;

const style = {
    border: '2px black solid',
    background: 'pink',
    width: '600px',
    height:'450px',
    position: 'absolute',
    left: '100px',
    top: '150px',
    zIndex: '100'
    }

const selectStyle = {
    margin: '10px',
    padding: '10px',
    fontSize: '16px'
}

const inputStyle = {
    padding:"5px",
    fontSize: '16px'
}


export default class Popup extends React.Component {
    constructor(props){
        super(props)

        this.state ={
            command: this.props.data.typed,
            display:"",
            prompt:"",
            level:0
        }
    }

    componentWillMount(){
        this.setState({display:this.props.data.typed.slice(-1)[0]});
    }

    onChange = field => e => {
        this.setState({
            [field]: e.target.value
        });
    }

    handleKey = (event) => {
        if(event.key === 'Enter'){
            this.onSubmit();
        }
    }

    onSubmit = () => {

        let d = new Date();
        let due = d.getTime();    //as of right now we want to schedule new questions immediately
        //let due = d.getTime() + 86400000;  //adds exact number of ms in 1 day, wrong on DTS but ok
        
        console.log("Due is",due)
        const theBody = {
            //this submits a command to a users database, not for custom making levels, rather for SRS mode
            prompt:this.state.prompt,
            answer:this.state.display,
            answer2:"",
            answered:false,
            due:due,
            daysTillDue:0,
            repetitions:0
        }

        const theReq = `http://${ HOST }/api/srs`;

        fetch(theReq, {
            body: JSON.stringify(theBody), // data can be `string` or {object}!
            headers:{
            'Content-Type': 'application/json'
            },
            method:'POST'}).then( res => {
            if(!res.ok) console.log(res.status);

            res.text().then(resText => {
                console.log(resText);
                this.props.close();
            });


        })
    }

    renderOptions(){

        return this.props.data.typed.map((typed, index) => {
            return <option key={index} value={typed}>{typed}</option>
        });
    }

    selectOption= (event) => {
        
        this.setState({display: event.target.value});
    }

    render(){

        return (
            <div style={style}>
                <div >
                    <h3>Add command to Database</h3>
                    <div >
                        <form onKeyPress={this.handleKey }>
                            
                            <label>Command </label><input style={inputStyle} onChange={this.onChange('command')} value ={this.state.display} type="text"></input><br/>
                            <label>Prompt </label><input style={inputStyle} onChange={this.onChange('prompt')} type="text" size="200px"></input><br/>
                            <select style={selectStyle} onChange={this.selectOption}>
                                {this.renderOptions()}
                            </select>
                        <div > 
                        <button style={{fontSize:"16px"}} type="button" onClick={this.props.close}>Close </button>
                        <button style={{fontSize:"16px"}} type="button" onClick={this.onSubmit}>Submit</button>
                        </div>
                        </form>
                    </div>
                </div>
                
            </div>
        )
    }


}