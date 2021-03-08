interface LeaderboardProps {
    leaderboard: Record<string, number>
}

function Leaderboard ({leaderboard}: LeaderboardProps) {
    return (
        <ul>
            {Object.entries(leaderboard)
                .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                .map(([key, value]) => (
                    <li key={key}>
                        {key} - {value}
                    </li>
                ))}
        </ul>
    )
}

export default Leaderboard
