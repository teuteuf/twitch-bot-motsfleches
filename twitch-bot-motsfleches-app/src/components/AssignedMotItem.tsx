import {AssignedMot} from "./App";
import {socket} from "../socketio";
import classes from "./AssignedMotItem.module.css"
import {useState} from "react";

interface AssignedMotItemProps {
    assignedMot: AssignedMot
}

export default function AssignedMotItem ({assignedMot: {pseudo, definition, mot, guess, answer}}: AssignedMotItemProps) {

    const [updatedMot, setUpdatedMot] = useState(mot)

    const handleApprove = () => {
        socket.emit('approveMot', {pseudo, definition, mot, guess})
    }

    const handleDelete = () => {
        socket.emit('deleteAssignedMot', {pseudo, mot, definition})
    }

    const handleUpdate = () => {
        socket.emit('updateAssignedMot', {pseudo, mot, updatedMot, definition})
    }

    return (
        <div className={classes.assignedMot}>
            <input className={classes.pseudo} value={pseudo} disabled/>
            <input className={classes.definition} value={definition} disabled/>
            <input className={classes.mot} value={updatedMot} onChange={(e) => setUpdatedMot(e.target.value)}/>
            <input className={classes.guess} value={guess} disabled placeholder="¯\_(ツ)_/¯"/>
            <input className={classes.answer} value={answer} disabled placeholder="réponse"/>
            <button type="button" onClick={handleUpdate}>UPDATE</button>
            <button type="button" onClick={handleDelete}>SUPPRIMER</button>
            <button type="button" onClick={handleApprove}>VALIDER</button>
        </div>
    )
}
