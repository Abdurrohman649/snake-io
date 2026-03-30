const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Статические файлы
app.use(express.static('.'));

// Игровое состояние
let gameState = {
  players: {},
  food: { x: 10, y: 10 },
  gridSize: 20
};

let gameInterval;

// Генерация случайной еды
function generateFood() {
  gameState.food = {
    x: Math.floor(Math.random() * gameState.gridSize),
    y: Math.floor(Math.random() * gameState.gridSize)
  };
}

// Проверка столкновений
function checkCollisions() {
  const players = Object.values(gameState.players);
  for (let player of players) {
    // Столкновение со стенами
    if (player.snake[0].x < 0 || player.snake[0].x >= gameState.gridSize ||
        player.snake[0].y < 0 || player.snake[0].y >= gameState.gridSize) {
      player.alive = false;
    }
    // Столкновение с собой
    for (let i = 1; i < player.snake.length; i++) {
      if (player.snake[0].x === player.snake[i].x && player.snake[0].y === player.snake[i].y) {
        player.alive = false;
        break;
      }
    }
    // Столкновение с другими змейками
    for (let otherPlayer of players) {
      if (otherPlayer.id !== player.id) {
        for (let segment of otherPlayer.snake) {
          if (player.snake[0].x === segment.x && player.snake[0].y === segment.y) {
            player.alive = false;
            break;
          }
        }
      }
    }
  }
}

// Обновление игры
function updateGame() {
  const players = Object.values(gameState.players);
  for (let player of players) {
    if (!player.alive) continue;

    // Движение змейки
    const head = { ...player.snake[0] };
    switch (player.direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }
    player.snake.unshift(head);

    // Проверка еды
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
      player.score++;
      generateFood();
    } else {
      player.snake.pop();
    }
  }

  checkCollisions();

  // Отправка состояния всем клиентам
  io.emit('gameState', gameState);
}

// Socket.IO
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Добавление игрока
  gameState.players[socket.id] = {
    id: socket.id,
    snake: [{ x: Math.floor(Math.random() * gameState.gridSize), y: Math.floor(Math.random() * gameState.gridSize) }],
    direction: 'right',
    score: 0,
    alive: true,
    nickname: 'Player',
    skin: '🐍'
  };

  socket.emit('init', { id: socket.id, gameState });

  // Обновление направления
  socket.on('changeDirection', (direction) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].direction = direction;
    }
  });

  // Обновление ника и скина
  socket.on('updatePlayer', (data) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].nickname = data.nickname || 'Player';
      gameState.players[socket.id].skin = data.skin || '🐍';
    }
  });

  // Отключение
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete gameState.players[socket.id];
  });
});

// Запуск игры
function startGame() {
  if (!gameInterval) {
    gameInterval = setInterval(updateGame, 200);
  }
}

startGame();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});