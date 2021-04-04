import {CurrentRush, ListsSettings} from "./App";
import {useRef, useState} from "react";
import SelectList from "./SelectList";
import classes from './SetupRush.module.css'
import {socket} from "../socketio";

interface SetupRushProps {
    currentRush: CurrentRush | null
    listsSettings: ListsSettings
}

function SetupRush({currentRush, listsSettings: {availableLists}}: SetupRushProps) {
    const [listName, setListName] = useState<string | null>(null)

    const newRushFormRef = useRef<HTMLFormElement | null>(null)
    const handleNewRushSubmit = (e: any) => {
        e.preventDefault()
        const {durationInMinutes, simultaneousMotsCount, maxMotsCount} = e.target
        const newRushParams = {
            durationInMinutes: parseInt(durationInMinutes.value),
            simultaneousMotsCount: parseInt(simultaneousMotsCount.value),
            maxMotsCount: parseInt(maxMotsCount.value),
            listName
        }

        socket.emit('startNewRush', newRushParams)

        newRushFormRef.current?.reset()
        setListName(null)
    }

    return (
        <>
            {
                currentRush == null
                    ? (
                        <form
                            className={classes.newRushForm}
                            ref={newRushFormRef}
                            onSubmit={handleNewRushSubmit}
                            autoComplete='off'
                        >
                            <input type='number' name='durationInMinutes' placeholder='Durée en minute' />
                            <input type='number' name='simultaneousMotsCount' placeholder='Nombre de mots simultanés' />
                            <input type='number' name='maxMotsCount' placeholder='Nombre de mots total' />
                            <SelectList availableLists={availableLists} handleChangeSelectedList={setListName} selectedList={listName ?? undefined} />
                            <button type="submit">START</button>
                        </form>
                    )
                    : (
                        <div className={classes.runningRush}>RUSH EN COURS - MOTS RESTANTS: {currentRush.remainingMotsCount + currentRush.currentMots.length} - HEURE DE FIN: {new Date(currentRush.endTime).toLocaleTimeString()}</div>
                    )
            }
        </>
    )
}

export default SetupRush