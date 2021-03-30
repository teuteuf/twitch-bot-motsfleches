import GiveMotCroiseForm from "./GiveMotCroiseForm";
import classes from './WaitingUsers.module.css'
import {socket} from "../socketio";

interface WaitingUsersProps {
    waitingUsers: string[]
    autoAssignEnabled: boolean
}

function WaitingUsers({waitingUsers, autoAssignEnabled}: WaitingUsersProps) {

    const handleTogglePause = () => {
        socket.emit('setAutoAssignEnabled', !autoAssignEnabled)
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
            <button type='button' className={classes.pauseButton} onClick={handleTogglePause}>
                {
                    autoAssignEnabled
                        ? <>⏸️ ASSIGNATION DE MOT AUTO ⏸️</>
                        : <>▶️ ASSIGNATION DE MOT AUTO ▶️</>
                }

            </button>
        </div>
    )
}

export default WaitingUsers
