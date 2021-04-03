import React, {useCallback, useEffect, useState} from 'react';
import classes from './App.module.css';
import {socket} from "../socketio";
import Section from "./Section";
import WaitingUsers from "./WaitingUsers";
import pacotilleImg from "./images/pacotille.png"
import AssignedMots from "./AssignedMots";
import Leaderboard from "./Leaderboard";
import AvailableMots from "./AvailableMots";
import ListsSettingsSection from "./ListsSettingsSection";

export interface AssignedMot {
    pseudo: string
    definition: string
    mot: string
    guess: string
    answer?: string
}

export interface AvailableMot {
    definition: string
    mot: string
    answer?: string
    listName?: string
}

export interface ListsSettings {
    availableLists: string[]
    defaultList?: string
    userLists: Record<string, string | null>
}

function App() {

    const [waitingUsers, setWaitingUsers] = useState<string[]>([])
    const [assignedMots, setAssignedMots] = useState<AssignedMot[]>([])
    const [leaderboard, setLeaderboard] = useState<Record<string, number>>({})
    const [availableMots, setAvailableMots] = useState<AvailableMot[]>([])
    const [autoAssignEnabled, setAutoAssignEnabled] = useState(false)
    const [listsSettings, setListsSettings] = useState<ListsSettings>({availableLists: [], userLists: {}})

    useEffect(() => {
        socket.on("waitingUsers", setWaitingUsers);
        socket.on('assignedMots', setAssignedMots);
        socket.on('leaderboard', setLeaderboard);
        socket.on('availableMots', setAvailableMots)
        socket.on('autoAssignEnabled', setAutoAssignEnabled)
        socket.on('listsSettings', setListsSettings)
    }, [])

    const handleUpdateUserScore = useCallback((pseudo, updatedScore) => {
        setLeaderboard(prevLeaderboard => {
            return {
                ...prevLeaderboard,
                [pseudo]: updatedScore
            }
        })
    }, [])

    return (
        <div className={classes.App}>
            <h1 className={classes.title}>
                <img src={pacotilleImg} alt="Pacotille Logo"/>
                <span>Dealer de Mots</span>
                <img src={pacotilleImg} alt="Pacotille Logo"/>
            </h1>
            <div className={classes.wrapper}>
                <div className={classes.sidePanel}>
                    <Section title="Leaderboard">
                        <Leaderboard leaderboard={leaderboard} onUpdateUserScore={handleUpdateUserScore}/>
                    </Section>
                </div>
                <div className={classes.mainPanel}>
                    <Section title={`Utilisateurs en attente (${waitingUsers.length})`}>
                        <WaitingUsers
                            waitingUsers={waitingUsers}
                            autoAssignEnabled={autoAssignEnabled}
                            listsSettings={listsSettings}
                        />
                    </Section>
                    <Section title={`Mots en attente (${assignedMots.length})`}>
                        <AssignedMots assignedMots={assignedMots}/>
                    </Section>
                    <Section title={`Listes de mots (${listsSettings.availableLists.length})`}>
                        <ListsSettingsSection listsSettings={listsSettings} />
                    </Section>
                    <Section title={`Mots disponibles (${availableMots.length})`}>
                        <AvailableMots
                            availableMots={availableMots}
                            listsSettings={listsSettings}
                        />
                    </Section>
                </div>
            </div>
        </div>
    );
}

export default App;
