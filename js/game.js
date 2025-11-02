// Game configuration
const CONFIG = {
    maxCanvasSize: 500,     // Maximum canvas size
    gridSize: 20,
    initialSpeed: 150,      // Initial speed (ms between updates)
    speedIncrease: 1.5,     // Speed increase per food eaten
    minSpeed: 50            // Minimum speed (maximum difficulty)
};

// DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const finalScoreElement = document.getElementById('finalScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const controlButtons = document.querySelectorAll('.control-btn');
const comboElement = document.getElementById('combo');
const comboContainer = document.getElementById('comboContainer');
const themeButtons = document.querySelectorAll('.theme-btn');

// Dynamic canvas size variables
let canvasSize = CONFIG.maxCanvasSize;
let cellSize = canvasSize / CONFIG.gridSize;

// Calculate optimal canvas size based on screen
function calculateCanvasSize() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const padding = 40; // Account for padding
    const availableWidth = containerWidth - padding;
    
    // Set canvas size (max 500px, but smaller on mobile)
    canvasSize = Math.min(CONFIG.maxCanvasSize, availableWidth);
    
    // Make sure it's divisible by gridSize for clean cells
    canvasSize = Math.floor(canvasSize / CONFIG.gridSize) * CONFIG.gridSize;
    
    // Update cell size
    cellSize = canvasSize / CONFIG.gridSize;
    
    // Set canvas dimensions
    canvas.width = canvasSize;
    canvas.height = canvasSize;
}

// Game state
let snake = [];
let direction = { x: 1, y: 0 };
let food = {};
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let gameSpeed = CONFIG.initialSpeed;
let isGameRunning = false;
let currentTheme = 'classic';
let combo = 0;
let comboTimer = null;
let particles = [];
let snakeTrail = [];

// Initialization
function init() {
    // Calculate and set canvas size
    calculateCanvasSize();
    
    // Load high score
    highScoreElement.textContent = highScore;
    
    // Event listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    document.addEventListener('keydown', handleKeyPress);
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // On-screen control buttons
    controlButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = btn.dataset.direction;
            handleDirection(dir);
        });
    });
    
    // Theme switcher
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTheme(btn.dataset.theme);
        });
    });
}

// Switch theme
function switchTheme(theme) {
    currentTheme = theme;
    
    // Update button states
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    // Update body class
    document.body.className = theme !== 'classic' ? `theme-${theme}` : '';
    
    // Redraw if game not running
    if (!isGameRunning) {
        draw();
    }
}

// Handle window resize
function handleResize() {
    const oldCanvasSize = canvasSize;
    calculateCanvasSize();
    
    // Redraw if canvas size changed and game is not running
    if (oldCanvasSize !== canvasSize && !isGameRunning) {
        draw();
    }
}

// Start game
function startGame() {
    startScreen.classList.add('hidden');
    resetGame();
    isGameRunning = true;
    gameLoop = setInterval(update, gameSpeed);
}

// Restart game
function restartGame() {
    gameOverScreen.classList.add('hidden');
    resetGame();
    isGameRunning = true;
    gameLoop = setInterval(update, gameSpeed);
}

// Reset game
function resetGame() {
    // Initial snake position (center)
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    
    direction = { x: 1, y: 0 };
    score = 0;
    gameSpeed = CONFIG.initialSpeed;
    scoreElement.textContent = score;
    combo = 0;
    comboElement.textContent = '0x';
    particles = [];
    snakeTrail = [];
    
    generateFood();
    draw();
}

// Generate food
function generateFood() {
    food = {
        x: Math.floor(Math.random() * CONFIG.gridSize),
        y: Math.floor(Math.random() * CONFIG.gridSize)
    };
    
    // Check if food appeared on snake
    const foodOnSnake = snake.some(segment => 
        segment.x === food.x && segment.y === food.y
    );
    
    if (foodOnSnake) {
        generateFood();
    }
}

// Handle key press
function handleKeyPress(e) {
    if (!isGameRunning) return;
    
    const key = e.key;
    
    // Prevent page scrolling with arrows
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
    }
    
    switch (key) {
        case 'ArrowUp':
            handleDirection('up');
            break;
        case 'ArrowDown':
            handleDirection('down');
            break;
        case 'ArrowLeft':
            handleDirection('left');
            break;
        case 'ArrowRight':
            handleDirection('right');
            break;
    }
}

// Handle direction
function handleDirection(dir) {
    switch (dir) {
        case 'up':
            if (direction.y === 0) direction = { x: 0, y: -1 };
            break;
        case 'down':
            if (direction.y === 0) direction = { x: 0, y: 1 };
            break;
        case 'left':
            if (direction.x === 0) direction = { x: -1, y: 0 };
            break;
        case 'right':
            if (direction.x === 0) direction = { x: 1, y: 0 };
            break;
    }
}

// Update game
function update() {
    // New head position
    const head = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };
    
    // Check wall collision
    if (head.x < 0 || head.x >= CONFIG.gridSize || 
        head.y < 0 || head.y >= CONFIG.gridSize) {
        gameOver();
        return;
    }
    
    // Check self collision
    const hitSelf = snake.some(segment => 
        segment.x === head.x && segment.y === head.y
    );
    
    if (hitSelf) {
        gameOver();
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check if food eaten
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        
        // Combo system
        combo++;
        comboElement.textContent = combo + 'x';
        comboContainer.classList.add('active');
        setTimeout(() => comboContainer.classList.remove('active'), 300);
        
        // Reset combo timer
        if (comboTimer) clearTimeout(comboTimer);
        comboTimer = setTimeout(() => {
            combo = 0;
            comboElement.textContent = '0x';
        }, 3000);
        
        // Create particles
        createParticles(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2);
        
        // Show floating text for combos
        if (combo >= 3) {
            showFloatingText(food.x * cellSize + cellSize / 2, food.y * cellSize + cellSize / 2, `${combo}x COMBO!`);
        }
        
        // Smooth speed increase with each point
        if (gameSpeed > CONFIG.minSpeed) {
            clearInterval(gameLoop);
            gameSpeed -= CONFIG.speedIncrease;
            // Don't let speed go below minimum
            if (gameSpeed < CONFIG.minSpeed) {
                gameSpeed = CONFIG.minSpeed;
            }
            gameLoop = setInterval(update, gameSpeed);
        }
        
        generateFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }
    
    // Update particles
    updateParticles();
    
    draw();
}

// Draw game
function draw() {
    // Theme-specific backgrounds
    if (currentTheme === 'neon') {
        ctx.fillStyle = '#0a0a0a';
    } else if (currentTheme === 'matrix') {
        ctx.fillStyle = '#000000';
    } else {
        ctx.fillStyle = '#f8f9fa';
    }
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Draw grid
    if (currentTheme === 'neon') {
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
    } else if (currentTheme === 'matrix') {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
    } else {
        ctx.strokeStyle = '#e9ecef';
    }
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= CONFIG.gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvasSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvasSize, i * cellSize);
        ctx.stroke();
    }
    
    // Draw trail effect
    drawTrail();
    
    // Draw snake
    snake.forEach((segment, index) => {
        // Gradient for snake
        const gradient = ctx.createLinearGradient(
            segment.x * cellSize,
            segment.y * cellSize,
            (segment.x + 1) * cellSize,
            (segment.y + 1) * cellSize
        );
        
        // Theme-specific colors
        if (currentTheme === 'neon') {
            if (index === 0) {
                gradient.addColorStop(0, '#00ff88');
                gradient.addColorStop(1, '#00d4ff');
            } else {
                gradient.addColorStop(0, '#00cc77');
                gradient.addColorStop(1, '#00aae6');
            }
        } else if (currentTheme === 'matrix') {
            if (index === 0) {
                gradient.addColorStop(0, '#00ff00');
                gradient.addColorStop(1, '#00cc00');
            } else {
                gradient.addColorStop(0, '#00dd00');
                gradient.addColorStop(1, '#00aa00');
            }
        } else {
            if (index === 0) {
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
            } else {
                gradient.addColorStop(0, '#7b8cde');
                gradient.addColorStop(1, '#8860aa');
            }
        }
        
        // Glow effect for neon and matrix themes
        if (currentTheme === 'neon' || currentTheme === 'matrix') {
            ctx.shadowBlur = 15;
            ctx.shadowColor = currentTheme === 'neon' ? '#00ff88' : '#00ff00';
        } else {
            ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            segment.x * cellSize + 2,
            segment.y * cellSize + 2,
            cellSize - 4,
            cellSize - 4
        );
        
        ctx.shadowBlur = 0;
        
        // Eyes for head
        if (index === 0) {
            ctx.fillStyle = 'white';
            const eyeSize = cellSize / 6;
            const eyeOffset = cellSize / 3;
            
            if (direction.x === 1) { // Right
                ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset, segment.y * cellSize + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else if (direction.x === -1) { // Left
                ctx.fillRect(segment.x * cellSize + eyeOffset - eyeSize, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(segment.x * cellSize + eyeOffset - eyeSize, segment.y * cellSize + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            } else if (direction.y === 1) { // Down
                ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + cellSize - eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset - eyeSize, segment.y * cellSize + cellSize - eyeOffset, eyeSize, eyeSize);
            } else if (direction.y === -1) { // Up
                ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + eyeOffset - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset - eyeSize, segment.y * cellSize + eyeOffset - eyeSize, eyeSize, eyeSize);
            }
        }
    });
    
    // Draw food
    const foodGradient = ctx.createRadialGradient(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        0,
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        cellSize / 2
    );
    
    // Theme-specific food colors
    if (currentTheme === 'neon') {
        foodGradient.addColorStop(0, '#ff00ff');
        foodGradient.addColorStop(1, '#ff0088');
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff00ff';
    } else if (currentTheme === 'matrix') {
        foodGradient.addColorStop(0, '#ffff00');
        foodGradient.addColorStop(1, '#cccc00');
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffff00';
    } else {
        foodGradient.addColorStop(0, '#ff6b6b');
        foodGradient.addColorStop(1, '#ee5a24');
    }
    
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        cellSize / 2 - 4,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw particles
    drawParticles();
}

// Game over
function gameOver() {
    clearInterval(gameLoop);
    isGameRunning = false;
    
    // Shake effect
    canvas.parentElement.classList.add('shake');
    setTimeout(() => canvas.parentElement.classList.remove('shake'), 500);
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreElement.textContent = highScore;
    }
    
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Particle system
function createParticles(x, y) {
    const particleCount = 15;
    const colors = currentTheme === 'neon' 
        ? ['#ff00ff', '#00ff88', '#00d4ff']
        : currentTheme === 'matrix'
        ? ['#00ff00', '#ffff00', '#00cc00']
        : ['#ff6b6b', '#667eea', '#764ba2'];
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: Math.random() * 4 + 2
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.vx *= 0.98;
        p.vy *= 0.98;
        return p.life > 0;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        
        if (currentTheme === 'neon' || currentTheme === 'matrix') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
        }
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
}

// Trail effect
function drawTrail() {
    if (snake.length > 0) {
        snakeTrail.push({
            x: snake[0].x,
            y: snake[0].y,
            alpha: 0.3
        });
        
        // Keep trail limited
        if (snakeTrail.length > 10) {
            snakeTrail.shift();
        }
        
        // Draw trail
        snakeTrail.forEach((trail, index) => {
            const alpha = (index / snakeTrail.length) * 0.3;
            ctx.globalAlpha = alpha;
            
            let color;
            if (currentTheme === 'neon') {
                color = '#00ff88';
            } else if (currentTheme === 'matrix') {
                color = '#00ff00';
            } else {
                color = '#667eea';
            }
            
            ctx.fillStyle = color;
            ctx.fillRect(
                trail.x * cellSize + 4,
                trail.y * cellSize + 4,
                cellSize - 8,
                cellSize - 8
            );
        });
        
        ctx.globalAlpha = 1;
    }
}

// Floating text effect
function showFloatingText(x, y, text) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = text;
    
    const rect = canvas.getBoundingClientRect();
    floatingText.style.left = rect.left + x + 'px';
    floatingText.style.top = rect.top + y + 'px';
    
    if (currentTheme === 'neon') {
        floatingText.style.color = '#00ff88';
        floatingText.style.textShadow = '0 0 10px #00ff88';
    } else if (currentTheme === 'matrix') {
        floatingText.style.color = '#00ff00';
        floatingText.style.textShadow = '0 0 10px #00ff00';
    } else {
        floatingText.style.color = '#667eea';
    }
    
    document.body.appendChild(floatingText);
    
    setTimeout(() => {
        floatingText.remove();
    }, 1000);
}

// Start game on page load
init();

