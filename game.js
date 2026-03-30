const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const cellSize = 30;

let gameState = {};
let myId = null;
let nickname = '';
let selectedSkin = '🐍';

// Меню
const mainMenu = document.getElementById('mainMenu');
const gameContainer = document.getElementById('gameContainer');
const nicknameInput = document.getElementById('nickname');
const skinOptions = document.querySelectorAll('.skin-option');
const joinBtn = document.getElementById('joinBtn');

// Выбор скина
skinOptions.forEach(option => {
  option.addEventListener('click', () => {
    skinOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    selectedSkin = option.dataset.skin;
  });
});

// Присоединение к игре
joinBtn.addEventListener('click', () => {
  nickname = nicknameInput.value.trim() || 'Player';
  socket.emit('updatePlayer', { nickname, skin: selectedSkin });
  mainMenu.style.display = 'none';
  gameContainer.style.display = 'block';
});

// Socket события
socket.on('init', (data) => {
  myId = data.id;
  gameState = data.gameState;
});

socket.on('gameState', (state) => {
  gameState = state;
  draw();
});

// Управление
document.addEventListener('keydown', (e) => {
  if (!myId || !gameState.players[myId]) return;

  let direction = null;
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      direction = 'up';
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      direction = 'down';
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      direction = 'left';
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      direction = 'right';
      break;
  }

  if (direction) {
    socket.emit('changeDirection', direction);
  }
});

// Рисование
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Фон
  ctx.fillStyle = '#0a0a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Сетка
  ctx.strokeStyle = '#1a1a4e';
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.stroke();
  }

  // Еда
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(gameState.food.x * cellSize, gameState.food.y * cellSize, cellSize, cellSize);

  // Игроки
  for (let playerId in gameState.players) {
    const player = gameState.players[playerId];
    if (!player.alive) continue;

    // Змейка
    ctx.fillStyle = playerId === myId ? '#00ff88' : '#ffaa00';
    for (let segment of player.snake) {
      ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize);
    }

    // Голова с эмодзи
    const head = player.snake[0];
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.skin, head.x * cellSize + cellSize / 2, head.y * cellSize + cellSize / 2 + 7);

    // Ник и очки
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${player.nickname}: ${player.score}`, head.x * cellSize, head.y * cellSize - 5);
  }
}

// Инициализация canvas
canvas.width = gridSize * cellSize;
canvas.height = gridSize * cellSize;