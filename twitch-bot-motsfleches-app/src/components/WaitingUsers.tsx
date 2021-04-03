import GiveMotCroiseForm from "./GiveMotCroiseForm";
import classes from './WaitingUsers.module.css'
import {socket} from "../socketio";
import {ListsSettings} from "./App";
import React from "react";
import SelectList from "./SelectList";

interface WaitingUsersProps {
    waitingUsers: string[]
    autoAssignEnabled: boolean
    listsSettings: ListsSettings
}

function WaitingUsers({waitingUsers, autoAssignEnabled, listsSettings: {availableLists, defaultList}}: WaitingUsersProps) {
    const handleTogglePause = () => {
        socket.emit('setAutoAssignEnabled', !autoAssignEnabled)
    }

    const handleChangeDefaultList = (listName: string | null) => {
        socket.emit('setDefaultList', listName)
    }

    return (
        <div>
            <ul>
                {waitingUsers.map((waitingUser, index) => (
                    <li key={`${waitingUser}-${index}`}>
                        <GiveMotCroiseForm pseudo={waitingUser}/>
                    </li>
                ))}
            </ul>
            <div className={classes.settings}>
                <SelectList
                    availableLists={availableLists}
                    selectedList={defaultList}
                    handleChangeSelectedList={handleChangeDefaultList}
                />
                <button type='button' onClick={handleTogglePause}>
                    {
                        autoAssignEnabled
                            ? <>⏸️ ASSIGNATION AUTO ACTIVE ⏸️</>
                            : <>▶️ ASSIGNATION AUTO EN PAUSE ▶️</>
                    }

                </button>
            </div>
        </div>
    )
}

export default WaitingUsers
