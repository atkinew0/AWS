//@ts-check
import React from 'react';
import Popup from './Popup';

const style = {
    border: 'black solid 2px',
    borderRadius: '10px',
    margin: '1px'
}

export default class Command extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            renderPop:false
        };

        
    }

    onClose = () => {
        this.setState({renderPop:false});
    }

    renderPop(){
        
        if(this.state.renderPop){
            return <Popup close ={this.onClose} data={this.props.data} />
        }
    }
    
    handleClick = (element) => {
        console.log("Clicked on me with data",element, element.typed,this.props.data);
        this.setState( {renderPop:true} );
        //rendering a Popup when clicked that allows user to save to database
    }

    render(){
        return (
        <div>
            <li style={style} onClick={this.handleClick} >{this.props.data.command}</li>
            {this.renderPop()}
            </div>
        );
    }

}