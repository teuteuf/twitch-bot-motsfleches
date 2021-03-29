// PubSub Token
// https://twitchapps.com/tokengen/
// scopes: channel:read:redemptions

import express from 'express'
import https from 'https'
import {Server as SocketIoServer} from 'socket.io'
import tmi from 'tmi.js'
import {PubSubClient as TwitchPubSubClient} from 'twitch-pubsub-client';
import {ApiClient as TwitchApiClient} from 'twitch';
import {StaticAuthProvider as TwitchStaticAuthProvider} from 'twitch-auth';
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

const serverPort = process.env.SERVER_PORT;
const botUsername = process.env.BOT_USERNAME;
const botPassword = process.env.BOT_PASSWORD;
const twitchChannel = process.env.TWITCH_CHANNEL;
const motFlecheRewardId = process.env.MOT_FLECHE_REWARD_ID;
const twitchAppClientId = process.env.TWITCH_APP_CLIENT_ID;
const twitchAppAccessToken = process.env.TWITCH_APP_ACCESS_TOKEN;
const testUsername = process.env.TEST_USERNAME;
const appUrl = process.env.APP_URL;


const options = {
    key: fs.readFileSync('./data/key.pem'),
    cert: fs.readFileSync('./data/cert.pem')
};

const app = express();
const server = https.createServer(options, app);
const io = new SocketIoServer(server, {cors: {origin: appUrl, methods: ["GET", "POST"]}});

const tmiClient = new tmi.Client({
    options: {debug: true, messagesLogLevel: "info"},
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: botUsername,
        password: botPassword
    },
    channels: [twitchChannel]
});
tmiClient.connect().catch(console.error);

const authProvider = new TwitchStaticAuthProvider(twitchAppClientId, twitchAppAccessToken);
const apiClient = new TwitchApiClient({authProvider});
const pubSubClient = new TwitchPubSubClient();
const userId = await pubSubClient.registerUserListener(apiClient);

server.listen(serverPort, () => {
    console.log(`listening on *:${serverPort}`);
});


const waitingUsers = parseFileOrDefault('./data/waitingUsers.json', [])
const assignedMots = parseFileOrDefault('./data/assignedMots.json', [])
let leaderboard = parseFileOrDefault('./data/leaderboard.json', {})
const availableMots = parseFileOrDefault('./data/availableMots.json', [])

function parseFileOrDefault(path, defaultValue) {
    return fs.existsSync(path)
        ? JSON.parse(fs.readFileSync(path, 'utf8'))
        : defaultValue
}

io.on('connection', (socket) => {
    socket.emit('waitingUsers', waitingUsers);
    socket.emit('assignedMots', assignedMots);
    socket.emit('leaderboard', leaderboard);
    socket.emit('availableMots', availableMots)

    socket.on('assignMot', assignMot);
    socket.on('approveMot', approveMot);
    socket.on('deleteAssignedMot', deleteAssignedMot);
    socket.on('updateAssignedMot', updateAssignedMot);
    socket.on('updateLeaderboard', updateLeaderboard);
    socket.on('addAvailableMot', addAvailableMot);
    socket.on('addAvailableMotsCsv', addAvailableMotsCsv);
    socket.on('deleteAvailableMot', deleteAvailableMot);
});

tmiClient.on('message', (channel, tags, message, self) => {
    if (self) return;

    if (message === '!test' && tags.username === testUsername) {
        addWaitingUser(tags.username)
    }

    if (message.startsWith('!mf ')) {
        tryGuess(tags.username, message.replace('!mf ', ''))
    }

    if (message === '!mfl') {
        displayLeaderboard()
    }

    if (message === '!mf') {
        displayMotsAssigned(tags.username)
    }
});

pubSubClient.onRedemption(userId, ({rewardId, userName}) => {
    if (rewardId === motFlecheRewardId) {
        addWaitingUser(userName)
    }
}).catch(console.error);

function addWaitingUser(pseudo) {
    console.log(`New waiting user: ${pseudo}`)
    waitingUsers.push(pseudo)
    io.emit('waitingUsers', waitingUsers)

    if (availableMots.length > 0) {
        const {definition, mot, answer} = availableMots[Math.floor(Math.random() * availableMots.length)]
        assignMot({pseudo, definition, mot, answer })
        deleteAvailableMot({definition, mot, answer})
    }

    updateJSONs()
}

function assignMot({pseudo, definition, mot, answer}) {
    console.log(`Word assigned to ${pseudo}: ${definition} - ${mot}`)
    const userIndex = waitingUsers.findIndex((user) => user === pseudo);
    if (userIndex >= 0) {
        waitingUsers.splice(userIndex, 1)
        io.emit('waitingUsers', waitingUsers)

        assignedMots.push({pseudo, definition, mot, guess: '', answer})
        io.emit('assignedMots', assignedMots)
        tmiClient.say(twitchChannel, `MOT POUR ${pseudo} : ${definition} - [ ${mot} ] (pour envoyer une réponse: !mf REPONSE, leaderboard: !mfl, mots assignés: !mf)`)

        updateJSONs()
    }
}

function tryGuess(pseudo, guess) {
    console.log(`${pseudo} has added a guess: ${guess}`)

    const pseudoAssignedMots = assignedMots.filter(assignedMot => assignedMot.pseudo === pseudo);
    pseudoAssignedMots.forEach(assignedMot => assignedMot.guess = guess)

    io.emit('assignedMots', assignedMots)

    updateJSONs()

    pseudoAssignedMots.forEach(({pseudo, definition, mot, guess, answer}) => {
        if (answer != null && sanitizeMot(guess).includes(sanitizeMot(answer))) {
            approveMot({pseudo, definition, mot, guess})
        }
    })
}

function approveMot({pseudo, definition, mot, guess}) {
    console.log(`Mot approved for ${pseudo} (${definition} - ${mot} - ${guess})`)
    const approvedIndex = findAssignedMotIndex(pseudo, mot, definition);
    assignedMots.splice(approvedIndex, 1)

    io.emit('assignedMots', assignedMots)

    tmiClient.say(twitchChannel, `GG ${pseudo} ! ${definition} - [ ${guess} ] +1point!`)

    if (leaderboard[pseudo] == null) {
        leaderboard[pseudo] = 1;
    } else {
        leaderboard[pseudo]++;
    }

    io.emit('leaderboard', leaderboard)

    updateJSONs()
}

function deleteAssignedMot({pseudo, mot, definition}) {
    console.log(`Delete mot of ${pseudo}: ${mot}`)
    const approvedIndex = findAssignedMotIndex(pseudo, mot, definition);
    assignedMots.splice(approvedIndex, 1)

    io.emit('assignedMots', assignedMots)

    updateJSONs()
}

function updateAssignedMot({pseudo, mot, updatedMot, definition}) {
    console.log(`Update assigned mot of ${pseudo}: ${definition} - ${mot} > ${updatedMot}`)
    const updateIndex = findAssignedMotIndex(pseudo, mot, definition);
    assignedMots[updateIndex].mot = updatedMot

    io.emit('assignedMots', assignedMots)

    tmiClient.say(twitchChannel, `Mise à jour du mot de ${pseudo} : ${definition} - [ ${updatedMot} ]`)
}

function updateLeaderboard(updatedLeaderboard) {
    leaderboard = updatedLeaderboard
    io.emit('leaderboard', leaderboard);
    updateJSONs()
}

function displayLeaderboard() {
    console.log(`Displaying leaderboard...`)
    tmiClient.say(twitchChannel, `MF LEADERBOARD: ${Object.entries(leaderboard)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .map(([pseudo, score], index) => `${index + 1}. ${pseudo} (${score}${score > 1 ? 'pts' : 'pt'})`)
        .join(', ')
    }`)
}

function displayMotsAssigned(pseudo) {
    console.log(`Displaying mots for ${pseudo}`)
    tmiClient.say(twitchChannel, `MF pour ${pseudo}: ${assignedMots
        .filter((assignedMot) => assignedMot.pseudo === pseudo)
        .map(({definition, mot}) => `${definition} - [ ${mot} ]`)
        .join(', ')
    }`)
}

function addAvailableMot({definition, mot, answer}) {
    console.log(`Add available mot : "${definition}" - [ ${mot} ] (${answer})`)
    availableMots.push({definition, mot, answer})
    io.emit('availableMots', availableMots)
    updateJSONs()
}

function addAvailableMotsCsv(csvContent) {
    console.log(`Add available mots csv:\n${csvContent}`)

    const newMots = csvContent
        .split('\n')
        .map(line => line.split('\t'))
        .filter(splitLine => splitLine.length === 2 && splitLine[0].trim().length > 0 && splitLine[1].trim().length > 0)
        .map(splitLine => {
            const answer = splitLine[0].replace(/ \(\d*\)/, '')
            const definition = `${splitLine[1]} (${answer.length})`
            const mot = '_'.repeat(answer.length).split('').join(' ')

            return {
                answer,
                definition,
                mot
            }
        })

    availableMots.push(...newMots)

    io.emit('availableMots', availableMots)
    updateJSONs()
}

function deleteAvailableMot({definition, mot, answer}) {
    console.log(`Delete available mot "${definition}" - [${mot}] (${answer})`)
    const motIndex = availableMots.findIndex(availableMot => availableMot.definition === definition && availableMot.mot === mot);
    availableMots.splice(motIndex, 1)

    io.emit('availableMots', availableMots)

    updateJSONs()
}

function findAssignedMotIndex(pseudo, mot, definition) {
    return assignedMots.findIndex(assignedMot =>
        assignedMot.pseudo === pseudo
        && assignedMot.mot === mot
        && assignedMot.definition === definition
    )
}

function sanitizeMot(mot) {
    return mot.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function updateJSONs() {
    console.log('Updating JSON files')
    fs.writeFileSync('./data/waitingUsers.json', JSON.stringify(waitingUsers))
    fs.writeFileSync('./data/assignedMots.json', JSON.stringify(assignedMots))
    fs.writeFileSync('./data/leaderboard.json', JSON.stringify(leaderboard))
    fs.writeFileSync('./data/availableMots.json', JSON.stringify(availableMots))
}
