// ===== CONSTANTS =====
const MAP_SIZE = 4000;
const INITIAL_LENGTH = 10;
const BOT_COUNT = 30;
const FOOD_COUNT = 600;
const SEGMENT_SIZE = 14;
const SPEED = 3;
const BOOST_SPEED = 5.5;
const BOOST_DRAIN = 0.4;
const BOOST_REGEN = 0.15;
const TURN_SPEED = 0.08;
const BOT_TURN_SPEED = 0.06;
const FOOD_SPAWN_ZONE_BONUS = 2;

// ===== SKINS =====
const SKINS = [
    { name: "Россия", colors: ["#fff","#0039a6","#d52b1e"], flag: true, price: 0 },
    { name: "USA", colors: ["#b22234","#fff","#3c3b6e"], flag: true, price: 0 },
    { name: "Бразилия", colors: ["#009c3b","#ffdf00","#002776"], flag: true, price: 0 },
    { name: "Германия", colors: ["#000","#dd0000","#ffcc00"], flag: true, price: 0 },
    { name: "Япония", colors: ["#fff","#bc002d","#fff"], flag: true, price: 0 },
    { name: "Украина", colors: ["#005bbb","#ffd500","#005bbb"], flag: true, price: 0 },
    { name: "Радуга", colors: ["#ff0000","#ff8800","#ffff00","#00ff00","#0088ff","#8800ff"], price: 0 },
    { name: "Неон", colors: ["#00ff88","#00ffff","#00ff88"], price: 0 },
    { name: "Огонь", colors: ["#ff4400","#ff8800","#ffcc00","#ff4400"], price: 100 },
    { name: "Лёд", colors: ["#88ddff","#ffffff","#aaeeff","#88ddff"], price: 100 },
    { name: "Галактика", colors: ["#1a0033","#4400aa","#8800ff","#cc44ff"], price: 200 },
    { name: "Матрица", colors: ["#003300","#00ff00","#003300"], price: 200 },
    { name: "Золотой", colors: ["#ffd700","#ffaa00","#ffd700","#fff0a0"], price: 300 },
    { name: "Бриллиант", colors: ["#b9f2ff","#e0f7ff","#87ceeb","#b9f2ff"], price: 400 },
    { name: "Пиксель", colors: ["#ff0000","#00ff00","#0000ff","#ffff00"], price: 150 },
    { name: "Ретро", colors: ["#00aa00","#008800","#006600"], price: 150 },
    { name: "Кибер", colors: ["#ff00ff","#00ffff","#ff00ff"], price: 250 },
    { name: "Токсик", colors: ["#00ff00","#88ff00","#ccff00","#00ff00"], price: 250 }
];

const BOT_NAMES = [
    "Viper","Python","Cobra","Mamba","Anaconda","Boa","Rattler","Asp",
    "Hydra","Basilisk","Serpent","Naga","Venom","Fang","Striker","Slick",
    "Coil","Zigzag","Shadow","Ghost","Phantom","Blaze","Storm","Thunder",
    "Frost","Ace","Neo","Hex","Byte","Pixel","Turbo","Flash","Laser",
    "Спартак","Змеюка","Шипучка","Кобра","Питон","Ядовитый","Мамба"
];

const ACHIEVEMENTS = [
    { id:"first_kill", name:"Первая кровь", desc:"Убей первую змейку", icon:"⚔️", check: s => s.totalKills >= 1 },
    { id:"eat_100", name:"Обжора", desc:"Съешь 100 еды за игру", icon:"🍕", check: s => s.bestScore >= 100 },
    { id:"eat_500", name:"Голодный", desc:"Съешь 500 еды за игру", icon:"🍔", check: s => s.bestScore >= 500 },
    { id:"top1", name:"Чемпион", desc:"Займи 1 место", icon:"👑", check: s => s.wasTop1 },
    { id:"survive_3m", name:"Выживший", desc:"Проживи 3 минуты", icon:"⏱️", check: s => s.bestTime >= 180 },
    { id:"survive_10m", name:"Ветеран", desc:"Проживи 10 минут", icon:"🏅", check: s => s.bestTime >= 600 },
    { id:"kill_5", name:"Серийный убийца", desc:"Убей 5 змеек за игру", icon:"💀", check: s => s.bestKills >= 5 },
    { id:"kill_20", name:"Терминатор", desc:"Убей 20 змеек за игру", icon:"🤖", check: s => s.bestKills >= 20 },
    { id:"play_10", name:"Завсегдатай", desc:"Сыграй 10 игр", icon:"🎮", check: s => s.totalGames >= 10 },
    { id:"play_50", name:"Фанат", desc:"Сыграй 50 игр", icon:"❤️", check: s => s.totalGames >= 50 },
    { id:"score_1000", name:"Тысячник", desc:"Набери 1000 очков", icon:"💎", check: s => s.bestScore >= 1000 },
    { id:"speed_demon", name:"Спидраннер", desc:"Используй ускорение 30 секунд", icon:"🚀", check: s => s.boostTime >= 30 }
];

// ===== GAME STATE =====
let canvas, ctx, minimapCanvas, minimapCtx;
let snakes = [], foods = [], particles = [];
let player = null;
let camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
let mouseX = 0, mouseY = 0;
let mouseDown = false;
let gameRunning = false;
let animFrame;
let kills = 0;
let gameTime = 0;
let lastTime = 0;
let boostTimeUsed = 0;
let selectedSkin = 0;
let selectedMode = 'classic';
let playerStats = {};
let unlockedAchievements = [];
let ownedSkins = [];
let coins = 0;
let isMobile = false;
let joystickActive = false;
let joystickAngle = 0;

// Audio context
let audioCtx = null;

// ===== INIT =====
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    minimapCanvas = document.getElementById('minimapCanvas');
    minimapCtx = minimapCanvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load saved data
    loadPlayerData();
    setupMenuBackground();
    buildSkinSelector();
    updateMenuStats();

    // Mouse/touch events
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', () => { mouseDown = true; });
    canvas.addEventListener('mouseup', () => { mouseDown = false; });
    document.addEventListener('keydown', e => {
        if (e.code === 'Space') { e.preventDefault(); mouseDown = true; }
    });
    document.addEventListener('keyup', e => {
        if (e.code === 'Space') mouseDown = false;
    });

    // Mobile detection
    isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (isMobile) setupMobileControls();

    // Show tutorial on first visit
    if (!localStorage.getItem('snakeio_tutorial_seen')) {
        // Tutorial will show on first play
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

// ===== SAVE / LOAD =====
function loadPlayerData() {
    try {
        playerStats = JSON.parse(localStorage.getItem('snakeio_stats') || '{}');
        playerStats.totalGames = playerStats.totalGames || 0;
        playerStats.totalKills = playerStats.totalKills || 0;
        playerStats.bestScore = playerStats.bestScore || 0;
        playerStats.totalTime = playerStats.totalTime || 0;
        playerStats.bestTime = playerStats.bestTime || 0;
        playerStats.bestKills = playerStats.bestKills || 0;
        playerStats.wasTop1 = playerStats.wasTop1 || false;
        playerStats.boostTime = playerStats.boostTime || 0;
        playerStats.xp = playerStats.xp || 0;
        playerStats.level = playerStats.level || 1;

        unlockedAchievements = JSON.parse(localStorage.getItem('snakeio_achievements') || '[]');
        ownedSkins = JSON.parse(localStorage.getItem('snakeio_skins') || '[0,1,2,3,4,5,6,7]');
        coins = parseInt(localStorage.getItem('snakeio_coins') || '0');

        const savedNick = localStorage.getItem('snakeio_nickname');
        if (savedNick) document.getElementById('nickname').value = savedNick;

        const savedSkin = localStorage.getItem('snakeio_skin');
        if (savedSkin !== null) selectedSkin = parseInt(savedSkin);
    } catch(e) {
        console.warn('Failed to load player data:', e);
    }
}

function savePlayerData() {
    try {
        localStorage.setItem('snakeio_stats', JSON.stringify(playerStats));
        localStorage.setItem('snakeio_achievements', JSON.stringify(unlockedAchievements));
        localStorage.setItem('snakeio_skins', JSON.stringify(ownedSkins));
        localStorage.setItem('snakeio_coins', coins.toString());
        localStorage.setItem('snakeio_nickname', document.getElementById('nickname').value);
        localStorage.setItem('snakeio_skin', selectedSkin.toString());
    } catch(e) {
        console.warn('Failed to save player data:', e);
    }
}

// ===== MENU =====
function setupMenuBackground() {
    const bg = document.getElementById('menuBg');
    const colors = ['#00ff88','#00ccff','#ff00cc','#ffaa00','#ff4444','#8800ff'];
    for (let i = 0; i < 20; i++) {
        const orb = document.createElement('div');
        orb.className = 'bg-orb';
        const size = Math.random() * 20 + 5;
        orb.style.width = size + 'px';
        orb.style.height = size + 'px';
        orb.style.left = Math.random() * 100 + '%';
        orb.style.background = colors[Math.floor(Math.random() * colors.length)];
        orb.style.animationDuration = (Math.random() * 8 + 4) + 's';
        orb.style.animationDelay = (Math.random() * 5) + 's';
        bg.appendChild(orb);
    }
}

function buildSkinSelector() {
    const container = document.getElementById('skinSelector');
    container.innerHTML = '';
    SKINS.forEach((skin, i) => {
        const div = document.createElement('div');
        div.className = 'skin-option' + (i === selectedSkin ? ' selected' : '') + (!ownedSkins.includes(i) ? ' locked' : '');
        const preview = document.createElement('canvas');
        preview.className = 'skin-preview';
        preview.width = 44;
        preview.height = 44;
        const pctx = preview.getContext('2d');
        const grad = pctx.createLinearGradient(0, 0, 44, 44);
        skin.colors.forEach((c, ci) => grad.addColorStop(ci / (skin.colors.length - 1), c));
        pctx.fillStyle = grad;
        pctx.fillRect(0, 0, 44, 44);
        div.appendChild(preview);
        div.onclick = () => {
            if (!ownedSkins.includes(i)) return;
            selectedSkin = i;
            document.querySelectorAll('.skin-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
        };
        div.title = skin.name;
        container.appendChild(div);
    });
}

function updateMenuStats() {
    const el = document.getElementById('menuStats');
    const lvl = document.getElementById('levelDisplay');
    el.innerHTML = `Игр: ${playerStats.totalGames} | Лучший: ${playerStats.bestScore} | Убийств: ${playerStats.totalKills}`;
    lvl.textContent = `Ур. ${playerStats.level}`;
    lvl.style.color = '#ffaa00';
}

function selectMode(mode) {
    selectedMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('selected');
    const labels = { classic: 'Классический', battle: 'Битва', endless: 'Бесконечный' };
    document.getElementById('modeLabel').textContent = labels[mode];
}

// ===== TUTORIAL =====
function showTutorial() {
    document.getElementById('tutorial').style.display = 'flex';
}

function closeTutorial() {
    document.getElementById('tutorial').style.display = 'none';
    localStorage.setItem('snakeio_tutorial_seen', 'true');
}

// ===== SHOP =====
function showShop() {
    document.getElementById('skinShop').style.display = 'flex';
    document.getElementById('shopCoins').textContent = coins;
    const grid = document.getElementById('shopGrid');
    grid.innerHTML = '';
    SKINS.forEach((skin, i) => {
        const item = document.createElement('div');
        item.className = 'shop-item' + (ownedSkins.includes(i) ? ' owned' : '');
        const preview = document.createElement('div');
        preview.className = 'preview';
        const grad = `linear-gradient(135deg, ${skin.colors.join(', ')})`;
        preview.style.background = grad;
        item.appendChild(preview);

        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = skin.name;
        item.appendChild(name);

        const price = document.createElement('div');
        price.className = 'price' + (ownedSkins.includes(i) ? ' owned-label' : '');
        price.textContent = ownedSkins.includes(i) ? 'Куплено' : `${skin.price} монет`;
        item.appendChild(price);

        item.onclick = () => buySkin(i);
        grid.appendChild(item);
    });
}

function buySkin(idx) {
    if (ownedSkins.includes(idx)) return;
    if (coins < SKINS[idx].price) {
        playSound('error');
        return;
    }
    coins -= SKINS[idx].price;
    ownedSkins.push(idx);
    savePlayerData();
    showShop(); // Refresh
    buildSkinSelector();
    playSound('buy');
}

function closeShop() {
    document.getElementById('skinShop').style.display = 'none';
}

// ===== ACHIEVEMENTS =====
function showAchievements() {
    document.getElementById('achievementsPanel').style.display = 'flex';
    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = '';
    ACHIEVEMENTS.forEach(a => {
        const card = document.createElement('div');
        const unlocked = unlockedAchievements.includes(a.id);
        card.className = 'achievement-card ' + (unlocked ? 'unlocked' : 'locked');
        card.innerHTML = `
            <div class="icon">${a.icon}</div>
            <div class="name">${a.name}</div>
            <div class="desc">${a.desc}</div>
        `;
        grid.appendChild(card);
    });
}

function closeAchievements() {
    document.getElementById('achievementsPanel').style.display = 'none';
}

function checkAchievements() {
    ACHIEVEMENTS.forEach(a => {
        if (!unlockedAchievements.includes(a.id) && a.check(playerStats)) {
            unlockedAchievements.push(a.id);
            showAchievementPopup(a);
            coins += 50;
        }
    });
    savePlayerData();
}

function showAchievementPopup(achievement) {
    const popup = document.getElementById('achievementPopup');
    popup.innerHTML = `<span style="font-size:28px">${achievement.icon}</span><div><div style="color:#ffd700;font-size:14px;">${achievement.name}</div><div style="font-size:11px;color:#aaa;">${achievement.desc}</div></div>`;
    popup.style.display = 'flex';
    popup.style.animation = 'none';
    popup.offsetHeight; // reflow
    popup.style.animation = 'achievePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), achieveFade 0.5s 2.5s forwards';
    setTimeout(() => { popup.style.display = 'none'; }, 3000);
}

// ===== ROOM FUNCTIONS (STUB - single player with bots) =====
function createRoom() {
    // In single-player mode, just start a game
    quickPlay();
}

function showRoomBrowser() {
    // Show a message that rooms are coming soon
    const el = document.getElementById('roomBrowser');
    el.style.display = 'flex';
    document.getElementById('roomsList').innerHTML = '<div style="text-align:center;color:#7788aa;padding:40px;">Скоро! Мультиплеер в разработке.</div>';
}

function closeRoomBrowser() {
    document.getElementById('roomBrowser').style.display = 'none';
}

function refreshRooms() {}
function joinByCode() { quickPlay(); }
function shareTo(platform) {}
function copyLink() {}
function leaveLobby() {
    document.getElementById('roomLobby').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
}
function startRoomGame() { quickPlay(); }

// ===== GAME START =====
function quickPlay() {
    // Show tutorial first time
    if (!localStorage.getItem('snakeio_tutorial_seen')) {
        showTutorial();
        // After closing tutorial, will need to click play again
        return;
    }
    startGame();
}

function startGame() {
    // Hide menus
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('deathScreen').style.display = 'none';
    document.getElementById('tutorial').style.display = 'none';
    document.getElementById('skinShop').style.display = 'none';
    document.getElementById('roomBrowser').style.display = 'none';
    document.getElementById('roomLobby').style.display = 'none';

    // Show game
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('gameUI').style.display = 'block';
    canvas.style.display = 'block';

    // Reset state
    snakes = [];
    foods = [];
    particles = [];
    kills = 0;
    gameTime = 0;
    boostTimeUsed = 0;

    // Mode adjustments
    let botCount = BOT_COUNT;
    let mapSize = MAP_SIZE;
    let foodCount = FOOD_COUNT;
    if (selectedMode === 'battle') {
        botCount = 50;
        mapSize = 2000;
        foodCount = 400;
    } else if (selectedMode === 'endless') {
        botCount = 20;
        foodCount = 800;
    }

    // Create player
    const nick = document.getElementById('nickname').value.trim() || 'Игрок';
    localStorage.setItem('snakeio_nickname', nick);
    player = createSnake(nick, selectedSkin, mapSize / 2 + (Math.random() - 0.5) * 400, mapSize / 2 + (Math.random() - 0.5) * 400, false, mapSize);
    snakes.push(player);

    // Create bots
    for (let i = 0; i < botCount; i++) {
        const bx = Math.random() * (mapSize - 200) + 100;
        const by = Math.random() * (mapSize - 200) + 100;
        const bname = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        const bskin = Math.floor(Math.random() * SKINS.length);
        const bot = createSnake(bname, bskin, bx, by, true, mapSize);
        snakes.push(bot);
    }

    // Create food
    for (let i = 0; i < foodCount; i++) {
        foods.push(createFood(mapSize));
    }

    // Init audio
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }

    // Save nickname
    savePlayerData();

    // Store map size for this game
    player._mapSize = mapSize;

    gameRunning = true;
    lastTime = performance.now();
    animFrame = requestAnimationFrame(gameLoop);
}

// ===== SNAKE CREATION =====
function createSnake(name, skinIdx, x, y, isBot, mapSize) {
    const segments = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
        segments.push({ x: x - i * SEGMENT_SIZE, y: y });
    }

    let botType = null;
    if (isBot) {
        const types = ['aggressive', 'collector', 'coward', 'strategist'];
        botType = types[Math.floor(Math.random() * types.length)];
    }

    return {
        name: name,
        skinIdx: skinIdx,
        segments: segments,
        angle: Math.random() * Math.PI * 2,
        targetAngle: 0,
        speed: SPEED,
        alive: true,
        score: INITIAL_LENGTH,
        boost: 100,
        isBoosting: false,
        isBot: isBot,
        botType: botType,
        botTimer: 0,
        botTarget: null,
        glowIntensity: 0,
        _mapSize: mapSize || MAP_SIZE
    };
}

function createFood(mapSize) {
    // Spawn zones: center has more food
    const ms = mapSize || MAP_SIZE;
    let x, y;
    if (Math.random() < 0.3) {
        // Center zone
        x = ms / 2 + (Math.random() - 0.5) * ms * 0.4;
        y = ms / 2 + (Math.random() - 0.5) * ms * 0.4;
    } else {
        x = Math.random() * (ms - 100) + 50;
        y = Math.random() * (ms - 100) + 50;
    }
    const hue = Math.random() * 360;
    return {
        x: x,
        y: y,
        radius: Math.random() * 4 + 3,
        color: `hsl(${hue}, 80%, 60%)`,
        glow: `hsl(${hue}, 80%, 40%)`,
        pulse: Math.random() * Math.PI * 2,
        value: 1
    };
}

// ===== GAME LOOP =====
function gameLoop(timestamp) {
    if (!gameRunning) return;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    gameTime += dt;

    update(dt);
    render();

    animFrame = requestAnimationFrame(gameLoop);
}

// ===== UPDATE =====
function update(dt) {
    const mapSize = player._mapSize || MAP_SIZE;

    // Update player angle
    if (player.alive) {
        if (isMobile && joystickActive) {
            player.targetAngle = joystickAngle;
        } else {
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            player.targetAngle = Math.atan2(mouseY - cy, mouseX - cx);
        }

        // Boosting
        player.isBoosting = mouseDown && player.boost > 0 && player.segments.length > INITIAL_LENGTH + 5;
        if (player.isBoosting) {
            player.boost = Math.max(0, player.boost - BOOST_DRAIN);
            boostTimeUsed += dt;
        } else {
            player.boost = Math.min(100, player.boost + BOOST_REGEN);
        }
    }

    // Update all snakes
    for (const snake of snakes) {
        if (!snake.alive) continue;

        // Bot AI
        if (snake.isBot) {
            updateBotAI(snake, dt, mapSize);
        }

        // Smooth turning
        let angleDiff = snake.targetAngle - snake.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const turnSpd = snake.isBot ? BOT_TURN_SPEED : TURN_SPEED;
        snake.angle += angleDiff * turnSpd * 60 * dt;

        // Speed
        const speed = snake.isBoosting ? BOOST_SPEED : SPEED;
        snake.speed = speed;

        // Move head
        const head = snake.segments[0];
        const newX = head.x + Math.cos(snake.angle) * speed * 60 * dt;
        const newY = head.y + Math.sin(snake.angle) * speed * 60 * dt;

        // Check map boundary
        if (newX < 0 || newX > mapSize || newY < 0 || newY > mapSize) {
            killSnake(snake, null, mapSize);
            continue;
        }

        // Move segments
        snake.segments.unshift({ x: newX, y: newY });

        // Trim to length based on score
        const targetLen = Math.max(INITIAL_LENGTH, snake.score);
        while (snake.segments.length > targetLen) {
            snake.segments.pop();
        }

        // Boost drain: lose segments
        if (snake.isBoosting && Math.random() < 0.15 * dt * 60) {
            if (snake.segments.length > INITIAL_LENGTH + 5) {
                const tail = snake.segments[snake.segments.length - 1];
                foods.push({
                    x: tail.x + (Math.random() - 0.5) * 10,
                    y: tail.y + (Math.random() - 0.5) * 10,
                    radius: 4,
                    color: SKINS[snake.skinIdx].colors[0],
                    glow: SKINS[snake.skinIdx].colors[0],
                    pulse: 0,
                    value: 1
                });
                snake.segments.pop();
                snake.score = Math.max(INITIAL_LENGTH, snake.score - 1);
            }
        }

        // Eat food
        for (let i = foods.length - 1; i >= 0; i--) {
            const f = foods[i];
            const dx = head.x - f.x;
            const dy = head.y - f.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const eatRadius = SEGMENT_SIZE + f.radius;
            if (dist < eatRadius) {
                snake.score += f.value;
                // Eat effect
                for (let p = 0; p < 3; p++) {
                    particles.push({
                        x: f.x, y: f.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        color: f.color,
                        life: 0.4,
                        size: f.radius
                    });
                }
                if (!snake.isBot) playSound('eat');
                foods.splice(i, 1);
                foods.push(createFood(mapSize));
            }
        }

        // Glow effect
        snake.glowIntensity = snake.isBoosting ? Math.min(1, snake.glowIntensity + dt * 3) : Math.max(0, snake.glowIntensity - dt * 2);
    }

    // Collision detection
    for (let i = 0; i < snakes.length; i++) {
        const a = snakes[i];
        if (!a.alive) continue;
        const ahead = a.segments[0];

        for (let j = 0; j < snakes.length; j++) {
            if (i === j) continue;
            const b = snakes[j];
            if (!b.alive) continue;

            // Check if a's head hits b's body (skip b's head)
            for (let k = 3; k < b.segments.length; k++) {
                const seg = b.segments[k];
                const dx = ahead.x - seg.x;
                const dy = ahead.y - seg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < SEGMENT_SIZE * 1.5) {
                    killSnake(a, b, mapSize);
                    if (b === player) { kills++; }
                    else if (a === player) { /* player died */ }
                    else if (!a.isBot && b.isBot) { kills++; }
                    break;
                }
            }
            if (!a.alive) break;
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.size *= 0.97;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Camera follow player
    if (player.alive) {
        const head = player.segments[0];
        camera.x += (head.x - camera.x) * 0.1;
        camera.y += (head.y - camera.y) * 0.1;

        // Zoom based on snake size
        camera.targetZoom = Math.max(0.4, Math.min(1, 1 - (player.score - INITIAL_LENGTH) * 0.001));
        camera.zoom += (camera.targetZoom - camera.zoom) * 0.05;
    }

    // Check if player is top 1
    if (player.alive) {
        const sorted = snakes.filter(s => s.alive).sort((a, b) => b.score - a.score);
        if (sorted[0] === player) {
            playerStats.wasTop1 = true;
        }
    }

    // Respawn dead bots
    for (const snake of snakes) {
        if (snake.isBot && !snake.alive) {
            // Respawn after a delay
            snake._respawnTimer = (snake._respawnTimer || 0) + 1;
            if (snake._respawnTimer > 180) {
                respawnBot(snake, mapSize);
            }
        }
    }

    // Update UI
    updateUI();
}

// ===== BOT AI =====
function updateBotAI(bot, dt, mapSize) {
    bot.botTimer -= dt;
    if (bot.botTimer <= 0) {
        bot.botTimer = 0.5 + Math.random() * 1;

        const head = bot.segments[0];
        const ms = mapSize || MAP_SIZE;

        switch (bot.botType) {
            case 'aggressive': {
                // Find nearest snake to attack
                let nearest = null, nearDist = 400;
                for (const s of snakes) {
                    if (s === bot || !s.alive) continue;
                    const d = dist(head, s.segments[0]);
                    if (d < nearDist && s.segments.length < bot.segments.length * 1.3) {
                        nearest = s;
                        nearDist = d;
                    }
                }
                if (nearest) {
                    bot.targetAngle = Math.atan2(nearest.segments[0].y - head.y, nearest.segments[0].x - head.x);
                    bot.isBoosting = nearDist < 200 && bot.boost > 30 && bot.segments.length > INITIAL_LENGTH + 10;
                } else {
                    seekFood(bot, head);
                }
                break;
            }
            case 'collector': {
                seekFood(bot, head);
                bot.isBoosting = false;
                break;
            }
            case 'coward': {
                // Run from nearby larger snakes
                let threat = null, threatDist = 300;
                for (const s of snakes) {
                    if (s === bot || !s.alive) continue;
                    const d = dist(head, s.segments[0]);
                    if (d < threatDist && s.segments.length > bot.segments.length) {
                        threat = s;
                        threatDist = d;
                    }
                }
                if (threat) {
                    bot.targetAngle = Math.atan2(head.y - threat.segments[0].y, head.x - threat.segments[0].x);
                    bot.isBoosting = threatDist < 150 && bot.boost > 20;
                } else {
                    seekFood(bot, head);
                }
                break;
            }
            case 'strategist': {
                // Circle around larger snakes trying to cut them off
                let target = null, targetDist = 500;
                for (const s of snakes) {
                    if (s === bot || !s.alive) continue;
                    const d = dist(head, s.segments[0]);
                    if (d < targetDist && s.segments.length > 20) {
                        target = s;
                        targetDist = d;
                    }
                }
                if (target && targetDist < 300) {
                    // Try to cut in front
                    const th = target.segments[0];
                    const ahead = {
                        x: th.x + Math.cos(target.angle) * 100,
                        y: th.y + Math.sin(target.angle) * 100
                    };
                    bot.targetAngle = Math.atan2(ahead.y - head.y, ahead.x - head.x);
                    bot.isBoosting = targetDist < 200 && bot.boost > 40;
                } else {
                    seekFood(bot, head);
                }
                break;
            }
        }

        // Avoid map edges
        const edgeDist = 200;
        if (head.x < edgeDist) bot.targetAngle = 0;
        else if (head.x > ms - edgeDist) bot.targetAngle = Math.PI;
        if (head.y < edgeDist) bot.targetAngle = Math.PI / 2;
        else if (head.y > ms - edgeDist) bot.targetAngle = -Math.PI / 2;
    }

    // Bot boost regen
    if (!bot.isBoosting) {
        bot.boost = Math.min(100, bot.boost + BOOST_REGEN);
    } else {
        bot.boost = Math.max(0, bot.boost - BOOST_DRAIN);
        if (bot.boost <= 0) bot.isBoosting = false;
    }
}

function seekFood(bot, head) {
    let nearest = null, nearDist = 300;
    for (const f of foods) {
        const d = dist(head, f);
        if (d < nearDist) {
            nearest = f;
            nearDist = d;
        }
    }
    if (nearest) {
        bot.targetAngle = Math.atan2(nearest.y - head.y, nearest.x - head.x);
    } else {
        bot.targetAngle += (Math.random() - 0.5) * 0.5;
    }
}

function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// ===== KILL / DEATH =====
function killSnake(snake, killer, mapSize) {
    snake.alive = false;
    snake._respawnTimer = 0;

    // Spawn food from body
    for (let i = 0; i < snake.segments.length; i += 2) {
        const seg = snake.segments[i];
        foods.push({
            x: seg.x + (Math.random() - 0.5) * 20,
            y: seg.y + (Math.random() - 0.5) * 20,
            radius: 5,
            color: SKINS[snake.skinIdx].colors[i % SKINS[snake.skinIdx].colors.length],
            glow: SKINS[snake.skinIdx].colors[0],
            pulse: 0,
            value: 2
        });
    }

    // Death particles
    for (let i = 0; i < 20; i++) {
        particles.push({
            x: snake.segments[0].x,
            y: snake.segments[0].y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: SKINS[snake.skinIdx].colors[0],
            life: 1,
            size: 6 + Math.random() * 4
        });
    }

    // Kill feed
    if (killer) {
        addKillFeed(killer.name, snake.name);
    }

    // If player died
    if (snake === player) {
        playSound('death');

        // Update stats
        playerStats.totalGames++;
        playerStats.totalKills += kills;
        playerStats.bestScore = Math.max(playerStats.bestScore, player.score);
        playerStats.bestTime = Math.max(playerStats.bestTime, gameTime);
        playerStats.bestKills = Math.max(playerStats.bestKills, kills);
        playerStats.boostTime = (playerStats.boostTime || 0) + boostTimeUsed;

        // XP
        const xpGained = Math.floor(player.score * 0.5 + kills * 10 + gameTime * 0.5);
        playerStats.xp += xpGained;

        // Level up
        const xpNeeded = playerStats.level * 100;
        while (playerStats.xp >= xpNeeded) {
            playerStats.xp -= xpNeeded;
            playerStats.level++;
            coins += 20;
        }

        // Coins
        coins += Math.floor(player.score * 0.1 + kills * 5);

        checkAchievements();
        savePlayerData();

        setTimeout(() => showDeathScreen(killer), 500);
    } else if (killer === player) {
        kills++;
        playSound('kill');
    }
}

function respawnBot(bot, mapSize) {
    const ms = mapSize || MAP_SIZE;
    const x = Math.random() * (ms - 200) + 100;
    const y = Math.random() * (ms - 200) + 100;
    bot.segments = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
        bot.segments.push({ x: x - i * SEGMENT_SIZE, y: y });
    }
    bot.angle = Math.random() * Math.PI * 2;
    bot.score = INITIAL_LENGTH;
    bot.alive = true;
    bot.boost = 100;
    bot.isBoosting = false;
    bot._respawnTimer = 0;
    bot.name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    bot.skinIdx = Math.floor(Math.random() * SKINS.length);
}

function addKillFeed(killerName, victimName) {
    const feed = document.getElementById('killFeed');
    const msg = document.createElement('div');
    msg.className = 'kill-msg';
    msg.innerHTML = `<span style="color:#ff8888">${killerName}</span> убил <span style="color:#88ccff">${victimName}</span>`;
    feed.appendChild(msg);
    setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 4000);

    // Keep max 5 messages
    while (feed.children.length > 5) {
        feed.removeChild(feed.firstChild);
    }
}

// ===== RENDER =====
function render() {
    const mapSize = player._mapSize || MAP_SIZE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Camera transform
    const zoom = camera.zoom;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-camera.x, -camera.y);

    // Background
    drawGrid(mapSize);
    drawBorder(mapSize);

    // Food
    drawFood();

    // Particles (under snakes)
    drawParticles();

    // Snakes
    const sortedSnakes = snakes.filter(s => s.alive).sort((a, b) => a.score - b.score);
    for (const snake of sortedSnakes) {
        drawSnake(snake);
    }

    ctx.restore();

    // Minimap
    drawMinimap(mapSize);
}

function drawGrid(mapSize) {
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(50, 50, 100, 0.3)';
    ctx.lineWidth = 1;

    const startX = Math.floor((camera.x - canvas.width / camera.zoom / 2) / gridSize) * gridSize;
    const endX = camera.x + canvas.width / camera.zoom / 2;
    const startY = Math.floor((camera.y - canvas.height / camera.zoom / 2) / gridSize) * gridSize;
    const endY = camera.y + canvas.height / camera.zoom / 2;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
        if (x >= 0 && x <= mapSize) {
            ctx.moveTo(x, Math.max(0, startY));
            ctx.lineTo(x, Math.min(mapSize, endY));
        }
    }
    for (let y = startY; y <= endY; y += gridSize) {
        if (y >= 0 && y <= mapSize) {
            ctx.moveTo(Math.max(0, startX), y);
            ctx.lineTo(Math.min(mapSize, endX), y);
        }
    }
    ctx.stroke();
}

function drawBorder(mapSize) {
    // Border glow
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 20;
    ctx.strokeRect(0, 0, mapSize, mapSize);
    ctx.shadowBlur = 0;

    // Danger zone
    const dangerWidth = 50;
    const grad = ctx.createLinearGradient(0, 0, dangerWidth, 0);
    grad.addColorStop(0, 'rgba(255, 0, 0, 0.15)');
    grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, dangerWidth, mapSize);

    const grad2 = ctx.createLinearGradient(mapSize, 0, mapSize - dangerWidth, 0);
    grad2.addColorStop(0, 'rgba(255, 0, 0, 0.15)');
    grad2.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(mapSize - dangerWidth, 0, dangerWidth, mapSize);

    const grad3 = ctx.createLinearGradient(0, 0, 0, dangerWidth);
    grad3.addColorStop(0, 'rgba(255, 0, 0, 0.15)');
    grad3.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = grad3;
    ctx.fillRect(0, 0, mapSize, dangerWidth);

    const grad4 = ctx.createLinearGradient(0, mapSize, 0, mapSize - dangerWidth);
    grad4.addColorStop(0, 'rgba(255, 0, 0, 0.15)');
    grad4.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = grad4;
    ctx.fillRect(0, mapSize - dangerWidth, mapSize, dangerWidth);
}

function drawFood() {
    const viewX1 = camera.x - canvas.width / camera.zoom / 2 - 20;
    const viewX2 = camera.x + canvas.width / camera.zoom / 2 + 20;
    const viewY1 = camera.y - canvas.height / camera.zoom / 2 - 20;
    const viewY2 = camera.y + canvas.height / camera.zoom / 2 + 20;

    for (const f of foods) {
        if (f.x < viewX1 || f.x > viewX2 || f.y < viewY1 || f.y > viewY2) continue;

        f.pulse += 0.03;
        const pulse = 1 + Math.sin(f.pulse) * 0.2;
        const r = f.radius * pulse;

        ctx.shadowColor = f.glow;
        ctx.shadowBlur = 8;

        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawSnake(snake) {
    const segments = snake.segments;
    if (segments.length < 2) return;

    const skin = SKINS[snake.skinIdx];
    const headSize = SEGMENT_SIZE + Math.min(snake.score * 0.05, 8);

    // Glow
    if (snake.glowIntensity > 0 || snake.isBoosting) {
        ctx.shadowColor = skin.colors[0];
        ctx.shadowBlur = 15 * snake.glowIntensity;
    }

    // Draw body segments
    for (let i = segments.length - 1; i >= 1; i--) {
        const seg = segments[i];
        const colorIdx = i % skin.colors.length;
        const t = i / segments.length;
        const segSize = SEGMENT_SIZE * (1 - t * 0.3);

        ctx.fillStyle = skin.colors[colorIdx];
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, segSize, 0, Math.PI * 2);
        ctx.fill();

        // Segment outline
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // Head
    const head = segments[0];
    ctx.fillStyle = skin.colors[0];
    ctx.beginPath();
    ctx.arc(head.x, head.y, headSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    const eyeDist = headSize * 0.45;
    const eyeSize = headSize * 0.35;
    const eyeAngle1 = snake.angle - 0.4;
    const eyeAngle2 = snake.angle + 0.4;

    // White
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(head.x + Math.cos(eyeAngle1) * eyeDist, head.y + Math.sin(eyeAngle1) * eyeDist, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x + Math.cos(eyeAngle2) * eyeDist, head.y + Math.sin(eyeAngle2) * eyeDist, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    const pupilOff = eyeSize * 0.3;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(head.x + Math.cos(eyeAngle1) * eyeDist + Math.cos(snake.angle) * pupilOff, head.y + Math.sin(eyeAngle1) * eyeDist + Math.sin(snake.angle) * pupilOff, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(head.x + Math.cos(eyeAngle2) * eyeDist + Math.cos(snake.angle) * pupilOff, head.y + Math.sin(eyeAngle2) * eyeDist + Math.sin(snake.angle) * pupilOff, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Name above head
    ctx.fillStyle = snake === player ? '#00ff88' : '#ffffff';
    ctx.font = 'bold 14px "Russo One", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeText(snake.name, head.x, head.y - headSize - 12);
    ctx.fillText(snake.name, head.x, head.y - headSize - 12);

    // Score under name
    ctx.fillStyle = '#aaa';
    ctx.font = '10px "Orbitron", sans-serif';
    ctx.strokeText(snake.score.toString(), head.x, head.y - headSize - 1);
    ctx.fillText(snake.score.toString(), head.x, head.y - headSize - 1);

    // Boost trail
    if (snake.isBoosting) {
        const tail = segments[segments.length - 1];
        for (let i = 0; i < 2; i++) {
            particles.push({
                x: tail.x + (Math.random() - 0.5) * 10,
                y: tail.y + (Math.random() - 0.5) * 10,
                vx: -Math.cos(snake.angle) * (Math.random() * 3 + 1),
                vy: -Math.sin(snake.angle) * (Math.random() * 3 + 1),
                color: skin.colors[0],
                life: 0.6,
                size: 4
            });
        }
    }
}

function drawMinimap(mapSize) {
    const ms = mapSize || MAP_SIZE;
    minimapCtx.fillStyle = 'rgba(10, 10, 46, 0.9)';
    minimapCtx.fillRect(0, 0, 160, 160);

    const scale = 160 / ms;

    // Border
    minimapCtx.strokeStyle = '#333366';
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(1, 1, 158, 158);

    // Food dots
    minimapCtx.fillStyle = 'rgba(255, 255, 100, 0.3)';
    for (let i = 0; i < foods.length; i += 8) {
        const f = foods[i];
        minimapCtx.fillRect(f.x * scale, f.y * scale, 1, 1);
    }

    // Snakes
    for (const snake of snakes) {
        if (!snake.alive) continue;
        const head = snake.segments[0];
        const x = head.x * scale;
        const y = head.y * scale;
        const size = Math.max(2, Math.min(snake.score * 0.03, 5));

        if (snake === player) {
            minimapCtx.fillStyle = '#00ff88';
            minimapCtx.shadowColor = '#00ff88';
            minimapCtx.shadowBlur = 5;
        } else {
            minimapCtx.fillStyle = SKINS[snake.skinIdx].colors[0];
            minimapCtx.shadowBlur = 0;
        }

        minimapCtx.beginPath();
        minimapCtx.arc(x, y, size, 0, Math.PI * 2);
        minimapCtx.fill();
    }
    minimapCtx.shadowBlur = 0;
}

// ===== UI UPDATE =====
function updateUI() {
    if (!player) return;

    document.getElementById('scoreValue').textContent = player.alive ? player.score : 0;
    document.getElementById('killsValue').textContent = kills;

    const mins = Math.floor(gameTime / 60);
    const secs = Math.floor(gameTime % 60);
    document.getElementById('timeValue').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    // Boost bar
    if (player.alive) {
        document.getElementById('boostFill').style.width = player.boost + '%';
    }

    // Leaderboard
    const alive = snakes.filter(s => s.alive).sort((a, b) => b.score - a.score).slice(0, 10);
    const lbList = document.getElementById('leaderboardList');
    lbList.innerHTML = '';
    alive.forEach((snake, i) => {
        const div = document.createElement('div');
        div.className = 'lb-entry' + (snake === player ? ' self' : '');
        const medal = i === 0 ? '\uD83D\uDC51' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : '';
        div.innerHTML = `
            <span class="lb-rank">${medal || (i + 1)}</span>
            <span class="lb-name">${snake.name}</span>
            <span class="lb-score">${snake.score}</span>
        `;
        lbList.appendChild(div);
    });
}

// ===== DEATH SCREEN =====
function showDeathScreen(killer) {
    gameRunning = false;
    cancelAnimationFrame(animFrame);

    document.getElementById('deathScreen').style.display = 'flex';
    document.getElementById('deathScore').textContent = player.score;
    document.getElementById('deathKills').textContent = kills;

    const mins = Math.floor(gameTime / 60);
    const secs = Math.floor(gameTime % 60);
    document.getElementById('deathTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('deathKiller').textContent = killer ? `Убит: ${killer.name}` : 'Выехал за карту';

    // XP display
    const xpGained = Math.floor(player.score * 0.5 + kills * 10 + gameTime * 0.5);
    document.getElementById('deathXP').textContent = `+${xpGained} XP | +${Math.floor(player.score * 0.1 + kills * 5)} монет`;
}

function respawn() {
    document.getElementById('deathScreen').style.display = 'none';
    startGame();
}

function backToMenu() {
    document.getElementById('deathScreen').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    gameRunning = false;
    cancelAnimationFrame(animFrame);
    updateMenuStats();
    buildSkinSelector();
}

// ===== SOUND =====
function playSound(type) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        switch(type) {
            case 'eat':
                osc.frequency.value = 600 + Math.random() * 200;
                osc.type = 'sine';
                gain.gain.value = 0.08;
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                osc.start(); osc.stop(audioCtx.currentTime + 0.1);
                break;
            case 'kill':
                osc.frequency.value = 300;
                osc.type = 'square';
                gain.gain.value = 0.1;
                osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                osc.start(); osc.stop(audioCtx.currentTime + 0.3);
                break;
            case 'death':
                osc.frequency.value = 400;
                osc.type = 'sawtooth';
                gain.gain.value = 0.15;
                osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
                osc.start(); osc.stop(audioCtx.currentTime + 0.5);
                break;
            case 'buy':
                osc.frequency.value = 500;
                osc.type = 'sine';
                gain.gain.value = 0.1;
                osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                osc.start(); osc.stop(audioCtx.currentTime + 0.2);
                break;
            case 'error':
                osc.frequency.value = 200;
                osc.type = 'square';
                gain.gain.value = 0.1;
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
                osc.start(); osc.stop(audioCtx.currentTime + 0.15);
                break;
        }
    } catch(e) {}
}

// ===== MOBILE CONTROLS =====
function setupMobileControls() {
    document.getElementById('mobileControls').style.display = 'block';
    document.getElementById('boostBtn').style.display = 'flex';

    const joystickArea = document.getElementById('joystickArea');
    const knob = document.getElementById('joystickKnob');
    const boostBtn = document.getElementById('boostBtn');

    let jCenter = { x: 0, y: 0 };

    joystickArea.addEventListener('touchstart', e => {
        e.preventDefault();
        joystickActive = true;
        const rect = joystickArea.getBoundingClientRect();
        jCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });

    joystickArea.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!joystickActive) return;
        const touch = e.touches[0];
        const dx = touch.clientX - jCenter.x;
        const dy = touch.clientY - jCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 45;
        const clamp = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        joystickAngle = angle;
        knob.style.transform = `translate(${-50 + (Math.cos(angle) * clamp / maxDist * 50)}%, ${-50 + (Math.sin(angle) * clamp / maxDist * 50)}%)`;
    });

    joystickArea.addEventListener('touchend', () => {
        joystickActive = false;
        knob.style.transform = 'translate(-50%, -50%)';
    });

    boostBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        mouseDown = true;
    });

    boostBtn.addEventListener('touchend', e => {
        e.preventDefault();
        mouseDown = false;
    });
}

// ===== INIT ON LOAD =====
window.addEventListener('load', init);
