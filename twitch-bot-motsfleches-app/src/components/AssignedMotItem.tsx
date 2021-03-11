import {AssignedMot} from "./App";
import {socket} from "../socketio";
import classes from "./AssignedMotItem.module.css"
import {useState} from "react";

interface AssignedMotItemProps {
    assignedMot: AssignedMot
}

export default function AssignedMotItem ({assignedMot: {pseudo, definition, mot, guess}}: AssignedMotItemProps) {

    const [updatedMot, setUpdatedMot] = useState(mot)

    const handleApprove = () => {
        socket.emit('approveMot', {pseudo, definition, mot, guess})
    }

    const handleDelete = () => {
        socket.emit('deleteAssignedMot', {pseudo, mot})
    }

    const handleUpdate = () => {
        socket.emit('updateAssignedMot', {pseudo, mot, updatedMot, definition})
    }

    return (
        <div className={classes.assignedMot}>
            <input value={pseudo} disabled/>
            <input className={classes.definition} value={definition} disabled/>
            <input className={classes.mot} value={updatedMot} onChange={(e) => setUpdatedMot(e.target.value)}/>
            <input className={classes.guess} value={guess} disabled placeholder="¯\_(ツ)_/¯"/>
            <button type="button" onClick={handleUpdate}>UPDATE</button>
            <button type="button" onClick={handleApprove}>SUPPRIMER</button>
            <button type="button" onClick={handleDelete}>VALIDER</button>
        </div>
    )
}
