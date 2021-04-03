import {ListsSettings} from "./App";
import {socket} from "../socketio";
import React, {useRef} from "react";
import classes from './ListsSettingsSection.module.css'

interface ListsSettingsSectionProps {
    listsSettings: ListsSettings
}

function ListsSettingsSection ({listsSettings}: ListsSettingsSectionProps) {

    const newListFormRef = useRef<HTMLFormElement | null>(null)
    const handleSubmitNewList = (e: any) => {
        e.preventDefault()
        const {listName} = e.target
        socket.emit('addNewList', listName.value)
        newListFormRef.current?.reset()
    }
    const handleRemoveList = (listName: string) => {
        socket.emit('removeList', listName)
    }


    const assignListFormRef = useRef<HTMLFormElement | null>(null)
    const handleSubmitAssignList = (e: any) => {
        e.preventDefault()
        const {pseudo, listName} = e.target
        socket.emit('setUserList', {
            pseudo: pseudo.value,
            listName: listName.value
        })
        assignListFormRef.current?.reset()
    }
    const handleRemoveUserList = (pseudo: string) => {
        socket.emit('setUserList', {
            pseudo,
            listName: null
        })
    }

    return (
        <div className={classes.wrapper}>
            <div className={classes.lists}>
                <h2>Listes de mots</h2>
                <ul>
                    {listsSettings.availableLists.map((availableList, index) => (
                        <li key={`${availableList}-${index}`}>
                            <span>{availableList}</span>
                            <button type='button' onClick={() => handleRemoveList(availableList)}>❌</button>
                        </li>
                    ))}
                </ul>
                <form
                    ref={newListFormRef}
                    onSubmit={handleSubmitNewList}
                    autoComplete="off"
                >
                    <input type='text' name='listName' placeholder='nom de liste'/>
                    <button type='submit'>AJOUTER</button>
                </form>
            </div>
            <div className={classes.lists}>
                <h2>Assignation Liste &lt;-&gt; User</h2>
                <ul>
                    {Object.entries(listsSettings.userLists)
                        .filter(([, list]) => list != null)
                        .map(([pseudo, list]) => (
                            <li key={pseudo}>
                                <span>{pseudo} | {list}</span>
                                <button type='button' onClick={() => handleRemoveUserList(pseudo)}>❌</button>
                            </li>
                        ))
                    }
                </ul>
                <form
                    ref={assignListFormRef}
                    onSubmit={handleSubmitAssignList}
                    autoComplete="off"
                >
                    <input type='text' name='pseudo' placeholder="pseudo" />
                    <select name='listName'>
                        {listsSettings.availableLists.map((listName, index) => (
                            <option key={`${listName}-${index}`} value={listName}>
                                {listName}
                            </option>
                        ))}
                    </select>
                    <button type='submit'>AJOUTER</button>
                </form>
            </div>
        </div>
    )
}

export default ListsSettingsSection
