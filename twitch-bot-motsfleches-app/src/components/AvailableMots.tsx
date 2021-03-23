import {AvailableMot} from "./App";
import React, {useRef} from "react";
import {socket} from "../socketio";
import AvailableMotItem from "./AvailableMotItem";
import classes from "./AvailableMots.module.css"

interface AvailableMotsProps {
    availableMots: AvailableMot[]
}

function AvailableMots({availableMots}: AvailableMotsProps) {
    const formRef = useRef<HTMLFormElement | null>(null)

    const handleSubmit = (e: any) => {
        e.preventDefault()
        const {definition, mot, answer} = e.target
        const availableMot = {
            definition: definition.value,
            mot: mot.value,
            answer: answer.value
        }
        socket.emit('addAvailableMot', availableMot)
        formRef.current?.reset()
    }

    return (
        <div>
            {availableMots.map((mot, index) => (
                <AvailableMotItem availableMot={mot} />
            ))}
            <form
                className={classes.form}
                ref={formRef}
                onSubmit={handleSubmit}
                autoComplete='off'
            >
                <input className={classes.definition} name='definition' placeholder='définition'/>
                <input className={classes.mot} name='mot' placeholder='C _ _ C O U'/>
                <input className={classes.answer} name='answer' placeholder='réponse'/>
                <button type='submit'>AJOUTER</button>
            </form>
        </div>
    )
}

export default AvailableMots
