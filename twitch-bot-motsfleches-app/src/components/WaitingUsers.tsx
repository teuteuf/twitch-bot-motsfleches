import GiveMotCroiseForm from "./GiveMotCroiseForm";

interface WaitingUsersProps {
    waitingUsers: string[]
}

function WaitingUsers({waitingUsers}: WaitingUsersProps) {
    return (
        <ul>
            {waitingUsers.map((waitingUser, index) => (
                <li key={`${waitingUser}-${index}`}>
                    <GiveMotCroiseForm pseudo={waitingUser}/>
                </li>
            ))}
        </ul>
    )
}

export default WaitingUsers
