import {AvailableMot} from "./App";
import classes from './AvailableMotItem.module.css'
import {socket} from "../socketio";

interface AvailableMotItemProps {
    availableMot: AvailableMot
}

function AvailableMotItem({availableMot: {definition, answer, mot}}: AvailableMotItemProps) {

    const handleDelete = () => {
        socket.emit('deleteAvailableMot', {definition, answer, mot})
    }

    return (
        <div className={classes.availableMot}>
            <input className={classes.definition} disabled value={definition}/>
            <input className={classes.mot} disabled value={mot}/>
            <input className={classes.answer} disabled value={answer}/>
            <button type="button" onClick={handleDelete}>DELETE</button>
        </div>
    )
}

export default AvailableMotItem
