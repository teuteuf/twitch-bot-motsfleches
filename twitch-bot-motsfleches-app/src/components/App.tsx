import React, {useEffect, useState} from 'react';
import classes from './App.module.css';
import {socket} from "../socketio";
import AssignedMotItem from "./AssignedMotItem";
import Section from "./Section";
import WaitingUsers from "./WaitingUsers";
import pacotilleImg from "./images/pacotille.png"

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
            <div className={classes.wrapper}>
                <h1 className={classes.title}>
                    <img src={pacotilleImg} alt="Krabby Logo"/>
                    <span>Dealer de Mots</span>
                    <img src={pacotilleImg} alt="Krabby Logo"/>
                </h1>
                <div className={classes.container}>
                    <Section title="Utilisateurs en attente">
                        <WaitingUsers waitingUsers={waitingUsers} />
                    </Section>
                    <Section title="Mots en attente">
                        <ul>
                            {assignedMots.map((assignedMot, index) => (
                                <li key={index}>
                                    <AssignedMotItem assignedMot={assignedMot}/>
                                </li>
                            ))}
                        </ul>
                    </Section>
                    <Section title="Leaderboard">
                        <ul>
                            {Object.entries(leaderboard)
                                .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                                .map(([key, value]) => (
                                    <li key={key}>
                                        {key} - {value}
                                    </li>
                                ))}
                        </ul>
                    </Section>
                </div>
            </div>
        </div>
    );
}

export default App;
