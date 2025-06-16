// Game state
const gameState = {
    scene: 'start',
    gold: 0,
    lineLength: 200,
    rodStrength: 100,
    boat: {
        x: 0,
        width: 120,    // 增加宽度
        height: 60,    // 增加高度
        maxSpeed: 6,
        shakeAngle: 0,    // 船的摇晃角度
        isShaking: false, // 是否正在摇晃
        shakeTimer: 0     // 摇晃计时器
    },
    hook: {
        x: 0,
        y: 0,
        isCasting: false,
        isReeling: false,
        castingProgress: 0,
        direction: { x: 0, y: 0 },
        caughtFish: null,
        hasShaken: false  // 新增：标记本次抛竿是否已经摇晃过
    },
    fishes: [],
    targetFishCount: 5,
    currentFishCount: 0,
    shakeCount: 3
};

// Fish types
const fishTypes = [
    { name: '小鱼', price: 10, weight: 50, color: '#3498db', speed: 1.5, fixedY: null, size: 2 },
    { name: '热带鱼', price: 15, weight: 60, color: '#f39c12', speed: 1.3, fixedY: null, size: 2.3 },
    { name: '金鱼', price: 20, weight: 80, color: '#ffd700', speed: 1.2, fixedY: null, size: 2.6 },
    { name: '中鱼', price: 25, weight: 100, color: '#2ecc71', speed: 1.0, fixedY: null, size: 3 },
    { name: '河豚', price: 30, weight: 120, color: '#b2bec3', speed: 0.9, fixedY: null, size: 3.5 },
    { name: '大鱼', price: 50, weight: 150, color: '#e74c3c', speed: 0.8, fixedY: null, size: 3.9 },
    { name: '章鱼', price: 60, weight: 180, color: '#8e44ad', speed: 0.7, fixedY: null, size: 4.4 },
    { name: '乌龟', price: 80, weight: 220, color: '#27ae60', speed: 0.6, fixedY: null, size: 4.8 },
    { name: '鲨鱼', price: 100, weight: 300, color: '#95a5a6', speed: 0.5, fixedY: null, size: 5.2 }
];

// Canvas setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = document.getElementById('game-container');
    // 让canvas和容器一样大
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// DOM elements
const startScene = document.getElementById('start-scene');
const gameScene = document.getElementById('game-scene');
const startButton = document.getElementById('start-game');
const fishTableBody = document.getElementById('fish-table-body');
const goldAmount = document.getElementById('gold-amount');
const currentLineLength = document.getElementById('current-line-length');
const currentRodStrength = document.getElementById('current-rod-strength');
const upgradeLineButton = document.getElementById('upgrade-line');
const upgradeRodButton = document.getElementById('upgrade-rod');
const fishCount = document.getElementById('fish-count');
const shakesLeft = document.getElementById('shakes-left');

// 添加图片资源
const images = {
    boat: new Image(),
    fishes: []
};

// 加载图片
function loadImages() {
    images.boat.src = 'asstte/船.png';
    
    // 加载鱼的图片
    for (let i = 1; i <= 9; i++) {
        const fishImg = new Image();
        fishImg.src = `asstte/鱼${i}.png`;
        images.fishes.push(fishImg);
    }
}

// Initialize fish table
function initializeFishTable() {
    fishTableBody.innerHTML = '';
    fishTypes.forEach((fish, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="asstte/鱼${index + 1}.png" alt="${fish.name}" style="width: 40px; height: 20px; object-fit: contain;">
                    ${fish.name}
                </div>
            </td>
            <td>${fish.price}</td>
            <td>${fish.weight}</td>
        `;
        fishTableBody.appendChild(row);
    });
}

// Update UI elements
function updateUI() {
    goldAmount.textContent = gameState.gold;
    currentLineLength.textContent = gameState.lineLength;
    currentRodStrength.textContent = gameState.rodStrength;
    fishCount.textContent = gameState.targetFishCount - gameState.currentFishCount;
    shakesLeft.textContent = gameState.shakeCount;
}

// Generate random fish
function generateFish() {
    // 根据鱼的大小设置生成概率
    const fishProbabilities = [
        0.5,  // 小鱼 (鱼1) - 50%概率
        0.3,  // 中鱼 (鱼2) - 30%概率
        0.15, // 大鱼 (鱼3) - 15%概率
        0.05  // 超大鱼 (鱼4) - 5%概率
    ];

    // 随机选择鱼的类型
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedType = 0;

    for (let i = 0; i < fishProbabilities.length; i++) {
        cumulativeProbability += fishProbabilities[i];
        if (random <= cumulativeProbability) {
            selectedType = i;
            break;
        }
    }

    const fishType = fishTypes[selectedType];
    const baseSize = 40; // 基础大小
    const size = baseSize * fishType.size; // 根据鱼的种类调整大小

    // 随机选择从哪个边界生成（0: 左, 1: 右, 2: 上, 3: 下）
    const spawnEdge = Math.floor(Math.random() * 4);
    let x, y, directionX, directionY;

    switch (spawnEdge) {
        case 0: // 左边界
            x = -size;
            y = canvas.height * 0.2 + Math.random() * (canvas.height * 0.7 - size);
            directionX = 1;
            directionY = Math.random() * 2 - 1;
            break;
        case 1: // 右边界
            x = canvas.width;
            y = canvas.height * 0.2 + Math.random() * (canvas.height * 0.7 - size);
            directionX = -1;
            directionY = Math.random() * 2 - 1;
            break;
        case 2: // 上边界
            x = Math.random() * (canvas.width - size);
            y = canvas.height * 0.2 - size;
            directionX = Math.random() * 2 - 1;
            directionY = 1;
            break;
        case 3: // 下边界
            x = Math.random() * (canvas.width - size);
            y = canvas.height * 0.9;
            directionX = Math.random() * 2 - 1;
            directionY = -1;
            break;
    }

    // 归一化方向向量
    const length = Math.sqrt(directionX * directionX + directionY * directionY);
    directionX /= length;
    directionY /= length;
    
    return {
        ...fishType,
        x: x,
        y: y,
        width: size,
        height: size * 0.5, // 保持宽高比
        direction: { x: directionX, y: directionY },
        speed: fishType.speed,
        state: 'move',
        stateTimer: randomStateTime('move'),
        directionChangeTimer: randomDirectionTime(),
        imageIndex: selectedType // 使用鱼的索引作为图片索引，确保同一种鱼使用相同的图片
    };
}

function randomDirection() {
    const angle = Math.random() * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
}
function randomStateTime(state) {
    // move状态持续1~3秒，stop状态持续1~3秒
    return state === 'move' ? 60 + Math.random() * 120 : 60 + Math.random() * 120;
}
function randomDirectionTime() {
    // 方向改变间隔1~3秒
    return 60 + Math.random() * 120;
}

// Initialize game
function initGame() {
    gameState.boat.x = canvas.width / 2;
    gameState.fishes = Array(10).fill(null).map(generateFish);
    gameState.currentFishCount = 0;
    gameState.shakeCount = 3;
    gameState.hook.isCasting = false;
    gameState.hook.isReeling = false;
    gameState.hook.caughtFish = null;
    gameState.hook.hasShaken = false;  // 重置摇晃标记
}

// Draw game elements
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw water surface (top 20%) with gradient
    const surfaceGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.2);
    surfaceGradient.addColorStop(0, '#87CEEB');
    surfaceGradient.addColorStop(1, '#1E90FF');
    ctx.fillStyle = surfaceGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.2);

    // Draw ocean (middle 70%) with gradient
    const oceanGradient = ctx.createLinearGradient(0, canvas.height * 0.2, 0, canvas.height * 0.9);
    oceanGradient.addColorStop(0, '#1E90FF');
    oceanGradient.addColorStop(1, '#000080');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, canvas.height * 0.2, canvas.width, canvas.height * 0.7);

    // Draw seabed (bottom 10%) with gradient
    const seabedGradient = ctx.createLinearGradient(0, canvas.height * 0.9, 0, canvas.height);
    seabedGradient.addColorStop(0, '#8B4513');
    seabedGradient.addColorStop(1, '#654321');
    ctx.fillStyle = seabedGradient;
    ctx.fillRect(0, canvas.height * 0.9, canvas.width, canvas.height * 0.1);

    // Draw boat with shake effect
    const boatY = canvas.height * 0.2 - gameState.boat.height / 2;
    ctx.save();
    // 如果船正在摇晃，应用旋转
    if (gameState.boat.isShaking) {
        ctx.translate(gameState.boat.x, boatY + gameState.boat.height / 2);
        ctx.rotate(gameState.boat.shakeAngle);
        ctx.drawImage(
            images.boat,
            -gameState.boat.width / 2,
            -gameState.boat.height / 2,
            gameState.boat.width,
            gameState.boat.height
        );
    } else {
        ctx.drawImage(
            images.boat,
            gameState.boat.x - gameState.boat.width / 2,
            boatY,
            gameState.boat.width,
            gameState.boat.height
        );
    }
    ctx.restore();

    // Draw fish
    gameState.fishes.forEach(fish => {
        // 根据鱼的方向翻转图片
        ctx.save();
        if (fish.direction.x < 0) {
            ctx.translate(fish.x + fish.width, fish.y);
            ctx.scale(-1, 1);
            ctx.drawImage(images.fishes[fish.imageIndex], 0, 0, fish.width, fish.height);
        } else {
            ctx.drawImage(images.fishes[fish.imageIndex], fish.x, fish.y, fish.width, fish.height);
        }
        ctx.restore();
    });

    // 如果正在收线且有钓到的鱼，绘制被钓起的鱼
    if (gameState.hook.isReeling && gameState.hook.caughtFish) {
        const fish = gameState.hook.caughtFish;
        ctx.save();
        if (fish.direction.x < 0) {
            ctx.translate(fish.x + fish.width, fish.y);
            ctx.scale(-1, 1);
            ctx.drawImage(images.fishes[fish.imageIndex], 0, 0, fish.width, fish.height);
        } else {
            ctx.drawImage(images.fishes[fish.imageIndex], fish.x, fish.y, fish.width, fish.height);
        }
        ctx.restore();
    }

    // Draw hook and line if casting or reeling
    if (gameState.hook.isCasting || gameState.hook.isReeling) {
        ctx.beginPath();
        ctx.moveTo(gameState.boat.x, boatY + gameState.boat.height / 2);
        ctx.lineTo(gameState.hook.x, gameState.hook.y);
        ctx.strokeStyle = '#000';
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(gameState.hook.x, gameState.hook.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 添加缓动函数
function easeOutQuad(t) {
    return t * (2 - t);
}

// Update game state
function update() {
    // 更新船的摇晃状态
    if (gameState.boat.isShaking) {
        gameState.boat.shakeTimer--;
        // 使用正弦函数创建摇晃效果
        gameState.boat.shakeAngle = Math.sin(gameState.boat.shakeTimer * 0.5) * 0.2;
        if (gameState.boat.shakeTimer <= 0) {
            gameState.boat.isShaking = false;
            gameState.boat.shakeAngle = 0;
        }
    }

    // Update fish positions and states
    gameState.fishes.forEach(fish => {
        // 状态计时
        fish.stateTimer--;
        fish.directionChangeTimer--;
        if (fish.stateTimer <= 0) {
            if (fish.state === 'move') {
                fish.state = 'stop';
                fish.stateTimer = randomStateTime('stop');
            } else {
                fish.state = 'move';
                fish.stateTimer = randomStateTime('move');
                // 切换为move时顺便随机一个新方向
                fish.direction = randomDirection();
                fish.directionChangeTimer = randomDirectionTime();
            }
        }
        // 方向改变计时
        if (fish.state === 'move' && fish.directionChangeTimer <= 0) {
            fish.direction = randomDirection();
            fish.directionChangeTimer = randomDirectionTime();
        }
        // 只在move状态下移动
        if (fish.state === 'move') {
            fish.x += fish.speed * fish.direction.x;
            fish.y += fish.speed * fish.direction.y;
        }
        // 边界限制（不反弹，只夹住）
        if (fish.x < 0) fish.x = 0;
        if (fish.x + fish.width > canvas.width) fish.x = canvas.width - fish.width;
        if (fish.y < canvas.height * 0.2) fish.y = canvas.height * 0.2;
        if (fish.y + fish.height > canvas.height * 0.9) fish.y = canvas.height * 0.9 - fish.height;
    });

    // Update hook position if casting or reeling
    if (gameState.hook.isCasting || gameState.hook.isReeling) {
        if (gameState.hook.isCasting) {
            // 使用缓动函数使鱼线延伸更加丝滑
            gameState.hook.castingProgress += 0.03 * (1 - gameState.hook.castingProgress * 0.5);
            if (gameState.hook.castingProgress >= 1) {
                gameState.hook.isCasting = false;
                gameState.hook.isReeling = true;
                return;
            }
        } else if (gameState.hook.isReeling) {
            // 收线动画
            gameState.hook.castingProgress -= 0.04;
            if (gameState.hook.castingProgress <= 0) {
                gameState.hook.isReeling = false;
                gameState.hook.castingProgress = 0;
                gameState.hook.hasShaken = false;  // 重置摇晃标记
                // 如果钓到了鱼，在这里处理奖励
                if (gameState.hook.caughtFish) {
                    gameState.gold += gameState.hook.caughtFish.price;
                    gameState.currentFishCount++;
                    updateUI();
                    gameState.hook.caughtFish = null;
                }
                return;
            }
        }

        const boatY = canvas.height * 0.2 - gameState.boat.height / 2;
        // 使用缓动函数计算实际进度
        const easedProgress = easeOutQuad(gameState.hook.castingProgress);
        gameState.hook.x = gameState.boat.x + gameState.hook.direction.x * (gameState.lineLength * easedProgress);
        gameState.hook.y = boatY + gameState.boat.height / 2 + gameState.hook.direction.y * (gameState.lineLength * easedProgress);

        // 如果正在收线且有钓到的鱼，更新鱼的位置
        if (gameState.hook.isReeling && gameState.hook.caughtFish) {
            gameState.hook.caughtFish.x = gameState.hook.x - gameState.hook.caughtFish.width / 2;
            gameState.hook.caughtFish.y = gameState.hook.y - gameState.hook.caughtFish.height / 2;
        }

        // 检查鱼钩和鱼的碰撞（在抛竿和收线时都检查）
        if (!gameState.hook.caughtFish) {  // 只在没有钓到鱼时检查
            gameState.fishes.forEach((fish, index) => {
                if (gameState.hook.x >= fish.x && gameState.hook.x <= fish.x + fish.width &&
                    gameState.hook.y >= fish.y && gameState.hook.y <= fish.y + fish.height) {
                    // Fish caught
                    if (fish.weight <= gameState.rodStrength) {
                        gameState.hook.caughtFish = fish;  // 保存钓到的鱼
                        gameState.fishes.splice(index, 1);
                        gameState.fishes.push(generateFish());
                        gameState.hook.isCasting = false;
                        gameState.hook.isReeling = true;
                    } else if (!gameState.hook.hasShaken) {  // 只在本次抛竿还没有摇晃过时触发
                        // 触发船的摇晃动画
                        shakeBoat();
                        gameState.shakeCount--;
                        gameState.hook.hasShaken = true;  // 标记已经摇晃过
                        if (gameState.shakeCount <= 0) {
                            gameOver();
                        }
                        gameState.hook.isCasting = false;
                        gameState.hook.isReeling = true;
                    }
                    updateUI();
                }
            });
        }

        // Check if reached seabed
        if (gameState.hook.y >= canvas.height * 0.9) {
            gameState.hook.isCasting = false;
            gameState.hook.isReeling = true;
        }
    }

    // Check if level complete
    if (gameState.currentFishCount >= gameState.targetFishCount) {
        levelComplete();
    }
}

// 新增：用于记录按键状态
const keyState = { left: false, right: false };

// 修改gameLoop，让船移动更丝滑
function gameLoop() {
    // 丝滑移动
    if (keyState.left) {
        gameState.boat.x -= gameState.boat.maxSpeed;
    }
    if (keyState.right) {
        gameState.boat.x += gameState.boat.maxSpeed;
    }
    // 保持船在画布内
    gameState.boat.x = Math.max(gameState.boat.width / 2, Math.min(canvas.width - gameState.boat.width / 2, gameState.boat.x));

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event listeners
startButton.addEventListener('click', () => {
    loadImages();  // 加载图片
    startScene.classList.add('hidden');
    gameScene.classList.remove('hidden');
    initGame();
    gameLoop();
});

upgradeLineButton.addEventListener('click', () => {
    const upgradeCost = 100;
    if (gameState.gold >= upgradeCost) {
        gameState.gold -= upgradeCost;
        gameState.lineLength += 50;
        updateUI();
    }
});

upgradeRodButton.addEventListener('click', () => {
    const upgradeCost = 100;
    if (gameState.gold >= upgradeCost) {
        gameState.gold -= upgradeCost;
        gameState.rodStrength += 50;
        updateUI();
    }
});

canvas.addEventListener('click', (e) => {
    if (!gameState.hook.isCasting) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Only allow casting in ocean area
        if (clickY > canvas.height * 0.2 && clickY < canvas.height * 0.9) {
            gameState.hook.isCasting = true;
            gameState.hook.castingProgress = 0;
            const boatY = canvas.height * 0.2 - gameState.boat.height / 2;
            const dx = clickX - gameState.boat.x;
            const dy = clickY - (boatY + gameState.boat.height / 2);
            const length = Math.sqrt(dx * dx + dy * dy);
            gameState.hook.direction = {
                x: dx / length,
                y: dy / length
            };
        }
    }
});

// 键盘按下/松开事件
document.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A') {
        keyState.left = true;
    } else if (e.key === 'd' || e.key === 'D') {
        keyState.right = true;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A') {
        keyState.left = false;
    } else if (e.key === 'd' || e.key === 'D') {
        keyState.right = false;
    }
});

// Game over function
function gameOver() {
    gameState.gold = 0;
    gameState.lineLength = 200;
    gameState.rodStrength = 100;
    startScene.classList.remove('hidden');
    gameScene.classList.add('hidden');
    updateUI();
    alert('游戏失败！请重新开始。');
}

// Level complete function
function levelComplete() {
    gameState.targetFishCount += 2; // Increase difficulty
    startScene.classList.remove('hidden');
    gameScene.classList.add('hidden');
    updateUI();
    alert('恭喜你完成关卡！');
}

// 添加摇晃动画函数
function shakeBoat() {
    gameState.boat.isShaking = true;
    gameState.boat.shakeTimer = 30; // 摇晃持续30帧
}

// Initialize the game
initializeFishTable();
updateUI(); 