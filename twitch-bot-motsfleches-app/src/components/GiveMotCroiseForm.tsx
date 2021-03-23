import React, {useRef} from 'react'
import {socket} from "../socketio";
import classes from "./GiveMotCroiseForm.module.css"

interface GiveMotCroiseFormProps {
    pseudo: string
}

function GiveMotCroiseForm({pseudo}: GiveMotCroiseFormProps) {

    const formRef = useRef<HTMLFormElement | null>(null)

    const handleSubmit = (e: any) => {
        e.preventDefault()
        const {pseudo, definition, mot, answer} = e.target
        const assignMot = {
            pseudo: pseudo.value,
            definition: definition.value,
            mot: mot.value,
            answer: answer.value
        }
        socket.emit('assignMot', assignMot)
        formRef.current?.reset()
    }

    return (
        <form
            className={classes.form}
            ref={formRef}
            onSubmit={handleSubmit}
            autoComplete="off"
        >
            <input name='pseudo' value={pseudo} disabled/>
            <input className={classes.definition} name='definition' placeholder='définition'/>
            <input className={classes.mot} name='mot' placeholder='C _ _ C O U'/>
            <input className={classes.answer} name='answer' placeholder='réponse'/>
            <button type='submit'>ENVOYER</button>
        </form>
    )
}

export default GiveMotCroiseForm
