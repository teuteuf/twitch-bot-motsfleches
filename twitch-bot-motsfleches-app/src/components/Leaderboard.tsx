import classes from './Leaderboard.module.css'

interface LeaderboardProps {
    leaderboard: Record<string, number>
}

function Leaderboard({leaderboard}: LeaderboardProps) {
    return (
        <ol className={classes.leaderboard}>
            {Object.entries(leaderboard)
                .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                .map(([pseudo, points]) => (
                    <li key={pseudo}>
                        <div className={classes.pseudo}>{pseudo}</div>
                        <div className={classes.points}>{points} {points > 1 ? 'points' : 'point'}</div>
                    </li>
                ))}
        </ol>
    )
}

export default Leaderboard
