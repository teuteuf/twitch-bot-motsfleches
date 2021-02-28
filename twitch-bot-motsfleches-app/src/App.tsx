import React, {useEffect, useState} from 'react';
import classes from './App.module.css';
import GiveMotCroiseForm from "./GiveMotCroiseForm";
import {socket} from "./socketio";
import AssignedMotItem from "./AssignedMotItem";

export interface AssignedMot {
    pseudo: string
    definition: string
    mot: string
    guess: string
}

function App() {

    const [waitingUsers, setWaitingUsers] = useState<string[]>([])
    const [assignedMots, setAssignedMots] = useState<AssignedMot[]>([])
    const [leaderboard, setLeaderboard] = useState<Record<string, number>>({})

    useEffect(() => {
        socket.on("waitingUsers", setWaitingUsers);
        socket.on('assignedMots', setAssignedMots);
        socket.on('leaderboard', setLeaderboard);
    }, [])

    return (
        <div className={classes.App}>
            Waiting users:
            <ul>
                {waitingUsers.map((waitingUser, index) => (
                    <li key={index}>
                        <GiveMotCroiseForm pseudo={waitingUser}/>
                    </li>
                ))}
            </ul>
            Assigned mots:
            <ul>
                {assignedMots.map((assignedMot, index) => (
                    <li key={index}>
                        <AssignedMotItem assignedMot={assignedMot} />
                    </li>
                ))}
            </ul>
            Leaderboard:
            <ul>
                {Object.entries(leaderboard).map(([key, value]) => (
                    <li key={key}>
                        {key} - {value}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;
