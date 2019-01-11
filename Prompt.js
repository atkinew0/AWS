import React from 'react';

let spanStyle = {
    display: 'inline-block',
    verticalAlign: 'middle',
    lineHeight: 'normal',
    color:'lightgoldenrodyellow',
    fontFamily: 'courier-new, courier, monospace',
    fontSize: '18px',
    overflowWrap:'break-word',
    overflow:'hidden'
}

let innerStyle = {
    height:"70%",
    width:"80%",
    margin:'auto',
    paddingTop:"10px",
    overflowWrap:'break-word',
    overflow:"hidden"
}

export default class Prompt extends React.Component {


    render(){
    
        let style={
                background:this.props.color,
                border:'#666666 3px solid',
                margin:'20px',
                borderRadius:'40px',
                height:"80px",
                textAlign:'left',
                whiteSpace: 'pre-wrap',
                overflow:'hidden'

            }
        

        return <div style={style}>
                    <div style={innerStyle}>
                        <span style={spanStyle}>{this.props.prompt}</span> 
                    </div>
                </div>;
    }


}