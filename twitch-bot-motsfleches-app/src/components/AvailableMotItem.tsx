import {AvailableMot, ListsSettings} from "./App";
import classes from './AvailableMotItem.module.css'
import {socket} from "../socketio";
import SelectList from "./SelectList";

interface AvailableMotItemProps {
    availableMot: AvailableMot
    listsSettings: ListsSettings
}

function AvailableMotItem({availableMot: {definition, answer, mot, listName}, listsSettings: {availableLists}}: AvailableMotItemProps) {

    const handleDelete = () => {
        socket.emit('deleteAvailableMot', {definition, answer, mot})
    }

    const handleSetList = (listName: string | null) => {
        socket.emit('setAvailableMotListName', {definition, mot, listName})
    }

    return (
        <div className={classes.availableMot}>
            <input className={classes.definition} disabled value={definition}/>
            <input className={classes.mot} disabled value={mot}/>
            <input className={classes.answer} disabled value={answer}/>
            <SelectList
                availableLists={availableLists}
                selectedList={listName}
                handleChangeSelectedList={handleSetList}
            />
            <button type="button" onClick={handleDelete}>DELETE</button>
        </div>
    )
}

export default AvailableMotItem
