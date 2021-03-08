import {ReactNode, useState} from "react";
import classes from './Section.module.css';

interface SectionProps {
    title: string
    minimizedByDefault?: boolean
    children: ReactNode
}

function Section({title, minimizedByDefault, children}: SectionProps) {
    const [minimized, setMinimized] = useState(!!minimizedByDefault)
    return (
        <div className={classes.section}>
            <h2>
                <span>{title}</span>
                <button type='button' onClick={() => setMinimized((prevState => !prevState))}>
                    {minimized ? '+' : '-'}
                </button>
            </h2>
            {!minimized && (
                <div>
                    {children}
                </div>
            )}
        </div>
    )
}

export default Section
