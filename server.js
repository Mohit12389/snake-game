const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Store active games
const games = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch(data.type) {
            case 'host':
                handleHost(ws, data);
                break;
            case 'join':
                handleJoin(ws, data);
                break;
            case 'ready':
                handleReady(ws, data);
                break;
            case 'game_state':
                handleGameState(ws, data);
                break;
            case 'game_over':
                handleGameOver(ws, data);
                break;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Clean up game if host disconnects
        for (const [gameId, game] of games.entries()) {
            if (game.host === ws || game.player === ws) {
                games.delete(gameId);
                if (game.host !== ws) game.host.send(JSON.stringify({ type: 'error', message: 'Player disconnected' }));
                if (game.player !== ws) game.player.send(JSON.stringify({ type: 'error', message: 'Host disconnected' }));
            }
        }
    });
});

function handleHost(ws, data) {
    const gameId = data.gameId;
    games.set(gameId, {
        host: ws,
        player: null,
        state: null
    });
    console.log(`Game ${gameId} created`);
}

function handleJoin(ws, data) {
    const gameId = data.gameId;
    const game = games.get(gameId);
    
    if (!game) {
        ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
        return;
    }
    
    if (game.player) {
        ws.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
        return;
    }
    
    game.player = ws;
    console.log(`Player joined game ${gameId}`);
}

function handleReady(ws, data) {
    const gameId = data.gameId;
    const game = games.get(gameId);
    
    if (!game) return;
    
    if (game.host === ws) {
        game.hostReady = true;
    } else if (game.player === ws) {
        game.playerReady = true;
    }
    
    if (game.hostReady && game.playerReady) {
        game.host.send(JSON.stringify({ type: 'game_start', gameId, player: '1' }));
        game.player.send(JSON.stringify({ type: 'game_start', gameId, player: '2' }));
    }
}

function handleGameState(ws, data) {
    const gameId = data.gameId;
    const game = games.get(gameId);
    
    if (!game) return;
    
    game.state = data.state;
    
    // Send state to other player
    const otherPlayer = game.host === ws ? game.player : game.host;
    if (otherPlayer) {
        otherPlayer.send(JSON.stringify({
            type: 'game_state',
            state: data.state
        }));
    }
}

function handleGameOver(ws, data) {
    const gameId = data.gameId;
    const game = games.get(gameId);
    
    if (!game) return;
    
    const otherPlayer = game.host === ws ? game.player : game.host;
    if (otherPlayer) {
        otherPlayer.send(JSON.stringify({
            type: 'game_over',
            winner: data.winner
        }));
    }
    
    // Clean up game
    games.delete(gameId);
}

console.log('WebSocket server running on port 8080'); 