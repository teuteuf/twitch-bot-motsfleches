import classes from './Leaderboard.module.css'
import {socket} from "../socketio";

interface LeaderboardProps {
    leaderboard: Record<string, number>
    onUpdateUserScore: (pseudo: string, updatedScore: number) => void
}

function Leaderboard({leaderboard, onUpdateUserScore}: LeaderboardProps) {

    const updateLeaderboard = (leaderboard: Record<string, number>) => {
        socket.emit('updateLeaderboard', leaderboard)
    }

    return (
        <div className={classes.wrapper}>
            <ol className={classes.leaderboard}>
                {Object.entries(leaderboard)
                    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                    .map(([pseudo, points]) => (
                        <li key={pseudo}>
                            <div className={classes.pseudo}>{pseudo}</div>
                            <div className={classes.points}>
                                <input
                                    value={points}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        onUpdateUserScore(pseudo, Number.isNaN(value) ? 0 : value);
                                    }}
                                />
                                <div>{points > 1 ? 'points' : 'point'}</div>
                            </div>
                        </li>
                    ))}
            </ol>
            <button onClick={() => updateLeaderboard(leaderboard)}>UPDATE</button>
            <button onClick={() => updateLeaderboard({})}>! CLEAR ALL !</button>
        </div>
    )
}

export default Leaderboard
