import React, {useRef} from 'react'
import {socket} from "../socketio";

interface GiveMotCroiseFormProps {
    pseudo: string
}

function GiveMotCroiseForm({pseudo}: GiveMotCroiseFormProps) {

    const formRef = useRef<HTMLFormElement | null>(null)

    const handleSubmit = (e: any) => {
        e.preventDefault()
        const {pseudo, definition, mot} = e.target
        const assignMot = {
            pseudo: pseudo.value,
            definition: definition.value,
            mot: mot.value
        }
        socket.emit('assignMot', assignMot)
        formRef.current?.reset()
    }

    return (
        <form ref={formRef} onSubmit={handleSubmit}>
            <input name='pseudo' value={pseudo} disabled/>
            <input name='definition' placeholder='definition'/>
            <input name='mot' placeholder='mot ex: C..COU'/>
            <button type='submit'>ENVOYER</button>
        </form>
    )
}

export default GiveMotCroiseForm
