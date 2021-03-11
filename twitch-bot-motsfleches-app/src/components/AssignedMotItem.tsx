import {AssignedMot} from "./App";
import {socket} from "../socketio";
import classes from "./AssignedMotItem.module.css"

interface AssignedMotItemProps {
    assignedMot: AssignedMot
}

export default function AssignedMotItem ({assignedMot: {pseudo, definition, mot, guess}}: AssignedMotItemProps) {

    const handleApprove = () => {
        socket.emit('approveMot', {pseudo, definition, mot, guess})
    }

    return (
        <div className={classes.assignedMot}>
            <input value={pseudo} disabled/>
            <input className={classes.definition} value={definition} disabled/>
            <input className={classes.mot} value={mot} disabled/>
            <input className={classes.guess} value={guess} disabled/>
            <button type="button" onClick={handleApprove}>APPROVE</button>
        </div>
    )
}
