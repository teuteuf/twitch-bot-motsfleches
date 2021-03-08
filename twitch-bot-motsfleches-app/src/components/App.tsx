import React, {useEffect, useState} from 'react';
import classes from './App.module.css';
import {socket} from "../socketio";
import Section from "./Section";
import WaitingUsers from "./WaitingUsers";
import pacotilleImg from "./images/pacotille.png"
import AssignedMots from "./AssignedMots";
import Leaderboard from "./Leaderboard";

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
                        <AssignedMots assignedMots={assignedMots} />
                    </Section>
                    <Section title="Leaderboard">
                        <Leaderboard leaderboard={leaderboard} />
                    </Section>
                </div>
            </div>
        </div>
    );
}

export default App;
