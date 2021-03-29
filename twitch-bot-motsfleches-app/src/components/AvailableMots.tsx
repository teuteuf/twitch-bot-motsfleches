import {AvailableMot} from "./App";
import React, {useRef} from "react";
import {socket} from "../socketio";
import AvailableMotItem from "./AvailableMotItem";
import classes from "./AvailableMots.module.css"

interface AvailableMotsProps {
    availableMots: AvailableMot[]
}

function AvailableMots({availableMots}: AvailableMotsProps) {
    const singleFormRef = useRef<HTMLFormElement | null>(null)
    const multipleFormRef = useRef<HTMLFormElement | null>(null)

    const handleSingleSubmit = (e: any) => {
        e.preventDefault()
        const {definition, mot, answer} = e.target
        const availableMot = {
            definition: definition.value,
            mot: mot.value,
            answer: answer.value
        }
        socket.emit('addAvailableMot', availableMot)
        singleFormRef.current?.reset()
    }

    const handleMultipleSubmit = (e: any) => {
        e.preventDefault()
        const {csvContent} = e.target
        socket.emit('addAvailableMotsCsv', csvContent.value)
        multipleFormRef.current?.reset()
    }

    return (
        <div>
            {availableMots.map((mot, index) => (
                <AvailableMotItem key={`${index}-${mot.definition}`} availableMot={mot} />
            ))}
            <form
                className={classes.singleForm}
                ref={singleFormRef}
                onSubmit={handleSingleSubmit}
                autoComplete='off'
            >
                <input className={classes.definition} name='definition' placeholder='définition'/>
                <input className={classes.mot} name='mot' placeholder='C _ _ C O U'/>
                <input className={classes.answer} name='answer' placeholder='réponse'/>
                <button type='submit'>AJOUTER</button>
            </form>
            <form
                className={classes.multipleForm}
                ref={multipleFormRef}
                onSubmit={handleMultipleSubmit}
                autoComplete='off'
            >
                <textarea name='csvContent' placeholder={'réponse{TAB}définition\nréponse (7){TAB}définition\n...'}/>
                <button type='submit'>AJOUTER EN MASSE</button>
            </form>
        </div>
    )
}

export default AvailableMots
