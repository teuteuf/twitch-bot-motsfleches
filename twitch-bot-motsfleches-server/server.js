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
import {DateTime} from "luxon";

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
let autoAssignEnabled = parseFileOrDefault('./data/autoAssignEnabled.json', true)
const listsSettings = parseFileOrDefault(
    './data/listsSettings.json',
    {availableLists: [], defaultList: null, userLists: {}}
)
let currentRush = parseFileOrDefault('./data/currentRush.json', null)
if (currentRush != null) {
    setTimeout(stopCurrentRush, currentRush.endTime - DateTime.now().toMillis())
}

function parseFileOrDefault(path, defaultValue) {
    return fs.existsSync(path)
        ? JSON.parse(fs.readFileSync(path, 'utf8'))
        : defaultValue
}

function updateJSONs() {
    console.log('Updating JSON files')
    fs.writeFileSync('./data/waitingUsers.json', JSON.stringify(waitingUsers))
    fs.writeFileSync('./data/assignedMots.json', JSON.stringify(assignedMots))
    fs.writeFileSync('./data/leaderboard.json', JSON.stringify(leaderboard))
    fs.writeFileSync('./data/availableMots.json', JSON.stringify(availableMots))
    fs.writeFileSync('./data/autoAssignEnabled.json', JSON.stringify(autoAssignEnabled))
    fs.writeFileSync('./data/listsSettings.json', JSON.stringify(listsSettings))
    fs.writeFileSync('./data/currentRush.json', JSON.stringify((currentRush)))
}

io.on('connection', (socket) => {
    socket.emit('waitingUsers', waitingUsers);
    socket.emit('assignedMots', assignedMots);
    socket.emit('leaderboard', leaderboard);
    socket.emit('availableMots', availableMots)
    socket.emit('autoAssignEnabled', autoAssignEnabled)
    socket.emit('listsSettings', listsSettings)
    socket.emit('currentRush', currentRush)

    socket.on('assignMot', assignMot);
    socket.on('approveMot', approveMot);
    socket.on('deleteAssignedMot', deleteAssignedMot);
    socket.on('updateAssignedMot', updateAssignedMot);
    socket.on('updateLeaderboard', updateLeaderboard);
    socket.on('addAvailableMot', addAvailableMot);
    socket.on('addAvailableMotsCsv', addAvailableMotsCsv);
    socket.on('deleteAvailableMot', deleteAvailableMot);
    socket.on('setAutoAssignEnabled', setAutoAssignEnabled);
    socket.on('addNewList', addNewList);
    socket.on('removeList', removeList);
    socket.on('setDefaultList', setDefaultList);
    socket.on('setUserList', setUserList);
    socket.on('setAvailableMotListName', setAvailableMotListName)
    socket.on('startNewRush', startNewRush)
});

tmiClient.on('message', (channel, tags, message, self) => {
    if (self) return;

    if (message === '!test' && tags.username === testUsername) {
        addWaitingUser(tags.username)
    }

    if (message === '!testrush' && tags.username === testUsername) {
        startNewRush({
            durationInMinutes: 1,
            listName: 'rush',
            simultaneousMotsCount: 3,
            maxMotsCount: 10
        })
    }

    if (message.startsWith('!mf ')) {
        tryGuess(tags.username, message.replace('!mf ', ''))
        if (currentRush != null) {
            tryGuessRush(tags.username, message.replace('!mf ', ''))
        }
    }

    if (message === '!mfl') {
        displayLeaderboard()
    }

    if (message === '!mf') {
        displayMotsAssigned(tags.username)
    }

    if (message === '!mfr') {
        displayCurrentRushInfos()
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
    updateJSONs()

    if (autoAssignEnabled) {
        tryToAutoAssignMot(pseudo);
    }
}

function tryToAutoAssignMot(pseudo) {
    let selectedAvailableMots = []

    const userListName = listsSettings.userLists[pseudo];
    if (userListName != null) {
        selectedAvailableMots = availableMots.filter(({listName}) => listName === userListName)
    }

    const { defaultList } = listsSettings
    if (defaultList != null && selectedAvailableMots.length === 0) {
        selectedAvailableMots = availableMots.filter(({listName}) => listName === defaultList)
    }

    if (selectedAvailableMots.length === 0) {
        selectedAvailableMots = availableMots.filter(({listName}) => listName == null)
    }

    if (selectedAvailableMots.length === 0) {
        selectedAvailableMots = availableMots
    }

    if (selectedAvailableMots.length > 0) {
        const {definition, mot, answer} = selectedAvailableMots[Math.floor(Math.random() * selectedAvailableMots.length)]
        assignMot({pseudo, definition, mot, answer})
        deleteAvailableMot({definition, mot, answer})
    }
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
            const splitMot = '_'.repeat(answer.length).split('');

            const hintCount = answer.length <= 3 ? 0 : Math.ceil(answer.length / 5)
            const letterIndexes = Array.from(splitMot.keys())
            for (let i = 0; i < hintCount; i++) {
                const pickedIndex = letterIndexes.splice(Math.floor(Math.random() * letterIndexes.length), 1)[0];
                splitMot[pickedIndex] = answer.charAt(pickedIndex)
            }

            const mot = splitMot.join(' ')

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

function setAutoAssignEnabled(value) {
    autoAssignEnabled = value
    io.emit('autoAssignEnabled', autoAssignEnabled)

    updateJSONs()
}

function addNewList (listName) {
    console.log(`Add new list ${listName}`);
    listsSettings.availableLists.push(listName)
    io.emit('listsSettings', listsSettings)
    updateJSONs()
}

function removeList (listName) {
    console.log(`Remove list ${listName}`);
    listsSettings.availableLists = listsSettings.availableLists.filter(list => list !== listName)
    io.emit('listsSettings', listsSettings)
    updateJSONs()
}

function setDefaultList (listName) {
    console.log(`Set default list: ${listName}`);
    listsSettings.defaultList = listName
    io.emit('listsSettings', listsSettings)
    updateJSONs()
}

function setUserList ({pseudo, listName}) {
    console.log(`Set list for ${pseudo}: ${listName}`);
    listsSettings.userLists[pseudo] = listName
    io.emit('listsSettings', listsSettings)
    updateJSONs()
}

function setAvailableMotListName ({definition, mot, listName}) {
    console.log(`Set list [${listName}] for available mot: ${definition} - [ ${mot} ]`)
    const availableMotToUpdate = availableMots.find(availableMot =>
        availableMot.definition === definition && availableMot.mot === mot
    );
    availableMotToUpdate.listName = listName
    io.emit('availableMots', availableMots)
    updateJSONs()
}

function startNewRush({durationInMinutes, listName, simultaneousMotsCount, maxMotsCount}) {
    console.log(`Start new rush: ${durationInMinutes} minutes, list ${listName ?? 'default'}, ${maxMotsCount} words and ${simultaneousMotsCount} simultaneous mots!`)
    currentRush = {
        durationInMinutes,
        listName,
        simultaneousMotsCount,
        maxMotsCount,
        startTime: DateTime.now().toMillis(),
        endTime: DateTime.now().plus({ minutes: durationInMinutes }).toMillis(),
        remainingMotsCount: maxMotsCount,
        currentMots: [],
        contributions: {}
    }

    tmiClient.say(twitchChannel, `MF RUSH - Début d'un rush de ${durationInMinutes} minutes et ${maxMotsCount} mots !`)

    refillMotsCurrentRush()

    setTimeout(stopCurrentRush, durationInMinutes * 60 * 1000)

    io.emit('currentRush', currentRush)

    updateJSONs()
}

function stopCurrentRush() {
    if (currentRush != null) {
        console.log('Stop current rush...')
        const {remainingMotsCount, currentMots} = currentRush
        tmiClient.say(twitchChannel, `MF RUSH - Temps écoulé ! Il restait ${remainingMotsCount + currentMots.length} mots...`)
        displayCurrentRushContribution()
        currentRush = null

        io.emit('currentRush', currentRush)

        updateJSONs()
    }
}

function refillMotsCurrentRush() {
    const {currentMots, simultaneousMotsCount, listName, remainingMotsCount} = currentRush
    for (let i = currentMots.length; i < simultaneousMotsCount && remainingMotsCount > 0; i++) {
        let rushAvailableMots = []

        if (listName != null) {
            rushAvailableMots = availableMots.filter(availableMot => availableMot.listName === listName)
        }

        if (rushAvailableMots.length === 0) {
            rushAvailableMots = availableMots.filter(availableMot => availableMot.listName == null)
        }

        if (rushAvailableMots.length === 0) {
            rushAvailableMots = availableMots
        }

        if (rushAvailableMots.length > 0) {
            const {definition, mot, answer} = rushAvailableMots[Math.floor(Math.random() * rushAvailableMots.length)]
            currentMots.push({definition, mot, answer})
            currentRush.remainingMotsCount--
            deleteAvailableMot({definition, mot, answer})
            tmiClient.say(twitchChannel, `MF RUSH - NOUVEAU MOT : ${definition} - [ ${mot} ] (pour envoyer une réponse: !mf REPONSE, infos du rush: !mfr)`)
        }
    }

    io.emit('currentRush', currentRush)
}

function tryGuessRush(pseudo, guess) {
    console.log(`MF RUSH - ${pseudo} try a guess: ${guess}`)

    currentRush.currentMots.forEach(({definition, mot, answer}) => {
        if (sanitizeMot(guess).includes(sanitizeMot(answer))) {
            tmiClient.say(twitchChannel, `MF RUSH - GG ${pseudo}! ${definition} - [ ${answer} ] !`)

            currentRush.contributions[pseudo] = (currentRush.contributions[pseudo] ?? 0) + 1

            const foundMotIndex = currentRush.currentMots.findIndex(currentMot =>
                currentMot.definition === definition && currentMot.mot === mot
            );
            currentRush.currentMots.splice(foundMotIndex, 1)

            refillMotsCurrentRush()
        }
    })

    if (currentRush.currentMots.length === 0) {
        tmiClient.say(twitchChannel, `MF RUSH - GG à tous ! Tous les mots ont été trouvés !`)
        displayCurrentRushContribution();
        currentRush = null
    }

    io.emit('currentRush', currentRush)

    updateJSONs()
}

function displayCurrentRushContribution() {
    tmiClient.say(twitchChannel, `CONTRIBUTIONS: ${Object.entries(currentRush.contributions)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .map(([pseudo, score], index) => `${index + 1}. ${pseudo} (${score}${score > 1 ? 'pts' : 'pt'})`)
        .join(', ')
    }`)
}

function displayCurrentRushInfos() {
    if (currentRush != null) {
        tmiClient.say(twitchChannel, `MF RUSH - Mots en cours : ${currentRush.currentMots
            .map(({definition, mot}) => `${definition} - [ ${mot} ]`)
            .join(', ')} (mots restants : ${currentRush.remainingMotsCount + currentRush.currentMots.length})`)
    } else {
        tmiClient.say(twitchChannel, `MF RUSH - Pas de rush en cours.`)
    }
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
