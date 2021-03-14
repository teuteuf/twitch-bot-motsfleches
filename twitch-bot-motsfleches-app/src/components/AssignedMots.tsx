import {AssignedMot} from "./App";
import AssignedMotItem from "./AssignedMotItem";
import React from "react";

interface AssignedMotsProps {
    assignedMots: AssignedMot[]
}

function AssignedMots({assignedMots}: AssignedMotsProps) {
    return (
        <ul>
            {assignedMots.map((assignedMot) => (
                <li key={`${assignedMot.pseudo}-${assignedMot.definition}-${assignedMot.mot}`}>
                    <AssignedMotItem assignedMot={assignedMot}/>
                </li>
            ))}
        </ul>
    )
}

export default AssignedMots
