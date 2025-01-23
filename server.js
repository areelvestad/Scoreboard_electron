const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, req.url === '/' ? 'Scoreboard_control.html' : req.url);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        } else {
            let contentType = 'text/html';
            if (filePath.endsWith('.css')) contentType = 'text/css';
            if (filePath.endsWith('.js')) contentType = 'application/javascript';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
});

const wss = new WebSocket.Server({ server });

const state = {
    team1Name: '',
    team2Name: '',
    team1Score: 0,
    team2Score: 0,
    team1Color: '#dd634d',
    team2Color: '#dd634d',
    currentTime: 0,
    timerInterval: null,
};

function broadcastState() {
    const sanitizedState = { ...state };
    delete sanitizedState.timerInterval;

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'state', value: sanitizedState }));
        }
    });
}

let startTime = null;
let lastBroadcastTime = null;

function startTimer() {
    if (!state.timerInterval) {
        console.log('Timer started');
        startTime = Date.now() - state.currentTime * 1000;
        lastBroadcastTime = Date.now();

        state.timerInterval = setInterval(() => {
            const now = Date.now();
            const totalElapsed = Math.floor((now - startTime) / 1000);
            state.currentTime = totalElapsed;

            if (now - lastBroadcastTime >= 1000) {
                lastBroadcastTime = now;
                broadcastState();
            }
        }, 1000);
    }
}

function pauseTimer() {
    console.log('Timer paused');
    clearInterval(state.timerInterval);
    state.timerInterval = null;
}

function resetTimer() {
    console.log('Timer reset');
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.currentTime = 0;
    broadcastState();
}

wss.on('connection', (ws) => {
    console.log('Client connected');

    const sanitizedState = { ...state };
    delete sanitizedState.timerInterval;

    ws.send(JSON.stringify({ type: 'state', value: sanitizedState }));


    ws.on('message', (message) => {
        const data = JSON.parse(message);
        switch (data.type) {
            case 'team1-name':
                state.team1Name = data.value;
                break;
            case 'team2-name':
                state.team2Name = data.value;
                break;
            case 'team1-score':
                state.team1Score = data.value;
                break;
            case 'team2-score':
                state.team2Score = data.value;
                break;
            case 'team1-color':
                state.team1Color = data.value;
                break;
            case 'team2-color':
                state.team2Color = data.value;
                break;
            case 'start-timer':
                startTimer();
                break;
            case 'pause-timer':
                pauseTimer();
                break;
            case 'reset-timer':
                resetTimer();
                break;
            case 'set-time':
                state.currentTime = data.value;
                broadcastState();
                break;
        }
        broadcastState();
    });
});

server.listen(8080, () => {
    console.log('Server running at http://localhost:8080/');
});
