import {AssignedMot} from "./App";
import {socket} from "./socketio";

interface AssignedMotItemProps {
    assignedMot: AssignedMot
}

export default function AssignedMotItem ({assignedMot: {pseudo, definition, mot, guess}}: AssignedMotItemProps) {

    const handleApprove = () => {
        socket.emit('approveMot', {pseudo, definition, mot, guess})
    }

    return (
        <div>
            <div>{`${pseudo} - ${definition} - ${mot} : ${guess}`}</div>
            <button type="button" onClick={handleApprove}>APPROVE</button>
        </div>
    )
}
