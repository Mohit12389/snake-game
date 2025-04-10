// Game Constants & Variables
let inputDir1 = {x: 0, y: 0};  // Player 1 direction
let inputDir2 = {x: 0, y: 0};  // Player 2 direction
const foodSound = new Audio('music/food.mp3');
const gameOverSound = new Audio('music/gameover.mp3');
const moveSound = new Audio('music/move.mp3');
const musicSound = new Audio('music/music.mp3');
let speed = 4;
let score1 = 0;
let score2 = 0;
let lastPaintTime = 0;

// Initialize both snakes
let snakeArr1 = [{x: 13, y: 15}];  // Player 1 snake
let snakeArr2 = [{x: 5, y: 15}];   // Player 2 snake

food = {x: 6, y: 7};  // initial position of food

// WebSocket and Game Mode Variables
let socket;
let gameMode;
let gameId;
let playerNumber;
let isGameActive = false;

// Initialize game based on URL parameters
function initializeGame() {
    const urlParams = new URLSearchParams(window.location.search);
    gameMode = urlParams.get('mode');
    gameId = urlParams.get('gameId');
    playerNumber = urlParams.get('player');

    if (gameMode === 'multi') {
        connectToGameServer();
    } else {
        isGameActive = true;
        startGame();
    }
}

// WebSocket Connection
function connectToGameServer() {
    socket = new WebSocket('wss://your-websocket-server-url');

    socket.onopen = () => {
        socket.send(JSON.stringify({
            type: 'ready',
            gameId: gameId,
            player: playerNumber
        }));
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'game_state':
                updateGameState(data.state);
                break;
            case 'game_start':
                isGameActive = true;
                startGame();
                break;
            case 'game_over':
                handleGameOver(data.winner);
                break;
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        alert('Connection error. Please try again.');
    };
}

// Game Functions
function main(ctime) {
    if (!isGameActive) return;
    
    window.requestAnimationFrame(main);
    if((ctime - lastPaintTime)/1000 < 1/speed){
        return;
    }
    lastPaintTime = ctime;
    gameEngine();
}

function isCollide(snake, otherSnake) {
    // If you bump into yourself 
    for (let i = 1; i < snake.length; i++) {
        if(snake[i].x === snake[0].x && snake[i].y === snake[0].y){
            return true;
        }
    }
    
    // If you bump into the other snake
    for (let i = 0; i < otherSnake.length; i++) {
        if(snake[0].x === otherSnake[i].x && snake[0].y === otherSnake[i].y){
            return true;
        }
    }
    
    // If you bump into the wall
    if(snake[0].x >= 18 || snake[0].x <=0 || snake[0].y >= 18 || snake[0].y <=0){
        return true;
    }
        
    return false;
}

function gameEngine(){
    if (gameMode === 'multi') {
        // Send game state to server
        socket.send(JSON.stringify({
            type: 'game_state',
            gameId: gameId,
            player: playerNumber,
            state: {
                snake1: snakeArr1,
                snake2: snakeArr2,
                food: food,
                score1: score1,
                score2: score2
            }
        }));
    }

    // Part 1: Updating the snake arrays & Food
    if(isCollide(snakeArr1, snakeArr2) || isCollide(snakeArr2, snakeArr1)){
        handleGameOver();
        return;
    }

    // Check if either snake eats the food
    if(snakeArr1[0].y === food.y && snakeArr1[0].x === food.x){
        foodSound.play();
        score1 += 1;
        document.getElementById('scoreBox1').innerHTML = "Player 1 Score: " + score1;
        snakeArr1.unshift({x: snakeArr1[0].x + inputDir1.x, y: snakeArr1[0].y + inputDir1.y});
        generateNewFood();
    }
    else if(snakeArr2[0].y === food.y && snakeArr2[0].x === food.x){
        foodSound.play();
        score2 += 1;
        document.getElementById('scoreBox2').innerHTML = "Player 2 Score: " + score2;
        snakeArr2.unshift({x: snakeArr2[0].x + inputDir2.x, y: snakeArr2[0].y + inputDir2.y});
        generateNewFood();
    }

    // Moving the snakes
    for (let i = snakeArr1.length - 2; i>=0; i--) {
        snakeArr1[i+1] = {...snakeArr1[i]};
    }
    for (let i = snakeArr2.length - 2; i>=0; i--) {
        snakeArr2[i+1] = {...snakeArr2[i]};
    }

    snakeArr1[0].x += inputDir1.x;
    snakeArr1[0].y += inputDir1.y;
    snakeArr2[0].x += inputDir2.x;
    snakeArr2[0].y += inputDir2.y;

    // Part 2: Display the snakes and Food
    board.innerHTML = "";
    
    // Display snake 1
    snakeArr1.forEach((e, index)=>{
        snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;
        if(index === 0){
            snakeElement.classList.add('head1');
        }
        else{
            snakeElement.classList.add('snake1');
        }
        board.appendChild(snakeElement);
    });

    // Display snake 2
    snakeArr2.forEach((e, index)=>{
        snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;
        if(index === 0){
            snakeElement.classList.add('head2');
        }
        else{
            snakeElement.classList.add('snake2');
        }
        board.appendChild(snakeElement);
    });

    // Display the food
    foodElement = document.createElement('div');
    foodElement.style.gridRowStart = food.y;
    foodElement.style.gridColumnStart = food.x;
    foodElement.classList.add('food');
    board.appendChild(foodElement);
}

function generateNewFood() {
    let a = 2;
    let b = 16;
    food = {
        x: Math.round(a + (b-a)* Math.random()),
        y: Math.round(a + (b-a)* Math.random())
    };
}

function handleGameOver(winner = null) {
    gameOverSound.play();   
    musicSound.pause();
    isGameActive = false;
    
    let message = "Game Over! ";
    if (winner) {
        message += `Player ${winner} wins! `;
    }
    message += "Press any key to play again!";
    
    alert(message);
    
    // Reset game state
    inputDir1 = {x: 0, y: 0};
    inputDir2 = {x: 0, y: 0};
    snakeArr1 = [{x: 13, y: 15}];
    snakeArr2 = [{x: 5, y: 15}];
    score1 = 0;
    score2 = 0;
    document.getElementById('scoreBox1').innerHTML = "Player 1 Score: " + score1;
    document.getElementById('scoreBox2').innerHTML = "Player 2 Score: " + score2;
    
    if (gameMode === 'multi') {
        socket.send(JSON.stringify({
            type: 'game_over',
            gameId: gameId,
            winner: winner
        }));
    }
}

function startGame() {
    musicSound.play();
    window.requestAnimationFrame(main);
}

// Event Listeners for Controls
window.addEventListener('keydown', e =>{
    if (!isGameActive) return;
    
    moveSound.play();
    
    // Player 1 controls (Arrow keys)
    if (gameMode === 'single' || playerNumber === '1') {
        switch (e.key) {
            case "ArrowUp":
                if(inputDir1.y !== 1) {
                    inputDir1.x = 0;
                    inputDir1.y = -1;
                }
                break;
            case "ArrowDown":
                if(inputDir1.y !== -1) {
                    inputDir1.x = 0;
                    inputDir1.y = 1;
                }
                break;
            case "ArrowLeft":
                if(inputDir1.x !== 1) {
                    inputDir1.x = -1;
                    inputDir1.y = 0;
                }
                break;
            case "ArrowRight":
                if(inputDir1.x !== -1) {
                    inputDir1.x = 1;
                    inputDir1.y = 0;
                }
                break;
        }
    }
    
    // Player 2 controls (WASD keys)
    if (gameMode === 'single' || playerNumber === '2') {
        switch (e.key.toLowerCase()) {
            case "w":
                if(inputDir2.y !== 1) {
                    inputDir2.x = 0;
                    inputDir2.y = -1;
                }
                break;
            case "s":
                if(inputDir2.y !== -1) {
                    inputDir2.x = 0;
                    inputDir2.y = 1;
                }
                break;
            case "a":
                if(inputDir2.x !== 1) {
                    inputDir2.x = -1;
                    inputDir2.y = 0;
                }
                break;
            case "d":
                if(inputDir2.x !== -1) {
                    inputDir2.x = 1;
                    inputDir2.y = 0;
                }
                break;
        }
    }
});

// Initialize the game
initializeGame();