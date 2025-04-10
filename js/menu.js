// WebSocket connection
let socket;
let gameId = null;
let isHost = false;

// DOM Elements
const singlePlayerBtn = document.getElementById('singlePlayer');
const multiPlayerBtn = document.getElementById('multiPlayer');
const multiplayerOptions = document.getElementById('multiplayerOptions');
const hostGameBtn = document.getElementById('hostGame');
const joinGameBtn = document.getElementById('joinGame');
const joinForm = document.getElementById('joinForm');
const hostInfo = document.getElementById('hostInfo');
const gameIdInput = document.getElementById('gameId');
const joinBtn = document.getElementById('joinBtn');
const gameCodeSpan = document.getElementById('gameCode');

// Event Listeners
singlePlayerBtn.addEventListener('click', () => {
    window.location.href = 'index.html?mode=single';
});

multiPlayerBtn.addEventListener('click', () => {
    multiplayerOptions.classList.remove('hidden');
});

hostGameBtn.addEventListener('click', () => {
    isHost = true;
    hostInfo.classList.remove('hidden');
    multiplayerOptions.classList.add('hidden');
    connectToServer();
});

joinGameBtn.addEventListener('click', () => {
    joinForm.classList.remove('hidden');
    multiplayerOptions.classList.add('hidden');
});

joinBtn.addEventListener('click', () => {
    const gameId = gameIdInput.value.trim();
    if (gameId) {
        isHost = false;
        connectToServer(gameId);
    }
});

// WebSocket Functions
function connectToServer(joinGameId = null) {
    // Connect to WebSocket server
    socket = new WebSocket('wss://your-websocket-server-url');

    socket.onopen = () => {
        if (isHost) {
            // Generate a random game ID
            gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
            gameCodeSpan.textContent = gameId;
            
            // Send host request
            socket.send(JSON.stringify({
                type: 'host',
                gameId: gameId
            }));
        } else {
            // Send join request
            socket.send(JSON.stringify({
                type: 'join',
                gameId: joinGameId
            }));
        }
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'game_start':
                // Redirect to game page with game ID
                window.location.href = `index.html?mode=multi&gameId=${data.gameId}&player=${data.player}`;
                break;
            case 'error':
                alert(data.message);
                break;
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        alert('Connection error. Please try again.');
    };
}

// Generate random game ID
function generateGameId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
} 