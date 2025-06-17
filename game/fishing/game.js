// Game state
const gameState = {
    scene: 'start',
    gold: 0,
    lineLength: 200,
    rodStrength: 100,
    lineUpgradeLevel: 0,  // Track upgrade level for fishing line
    rodUpgradeLevel: 0,   // Track upgrade level for rod strength
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
    { name: '白鱼', price: 10, weight: 50, color: '#FFFFFF', speed: 1.5, fixedY: null, size: 2 },
    { name: '红鱼', price: 15, weight: 60, color: '#FF0000', speed: 1.3, fixedY: null, size: 2.3 },
    { name: '橙鱼', price: 20, weight: 80, color: '#FFA500', speed: 1.2, fixedY: null, size: 2.6 },
    { name: '黄鱼', price: 25, weight: 100, color: '#FFFF00', speed: 1.0, fixedY: null, size: 3 },
    { name: '绿鱼', price: 30, weight: 120, color: '#00FF00', speed: 0.9, fixedY: null, size: 3.5 },
    { name: '青鱼', price: 50, weight: 150, color: '#00FFFF', speed: 0.8, fixedY: null, size: 3.9 },
    { name: '蓝鱼', price: 60, weight: 180, color: '#0000FF', speed: 0.7, fixedY: null, size: 4.4 },
    { name: '紫鱼', price: 80, weight: 220, color: '#800080', speed: 0.6, fixedY: null, size: 4.8 },
    { name: '黑鱼', price: 100, weight: 300, color: '#000000', speed: 0.5, fixedY: null, size: 5.2 }
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

// 绘制船的函数
function drawBoat(x, y, width, height, angle = 0) {
    ctx.save();
    ctx.translate(x + width/2, y + height/2);
    ctx.rotate(angle);
    
    // 船身
    ctx.beginPath();
    ctx.moveTo(-width/2, -height/2);
    ctx.lineTo(width/2, -height/2);
    ctx.lineTo(width/2, height/2);
    ctx.lineTo(-width/2, height/2);
    ctx.closePath();
    ctx.fillStyle = '#8B4513';  // 棕色
    ctx.fill();
    
    // 船舱
    ctx.beginPath();
    ctx.moveTo(-width/3, -height/2);
    ctx.lineTo(width/3, -height/2);
    ctx.lineTo(width/3, -height/4);
    ctx.lineTo(-width/3, -height/4);
    ctx.closePath();
    ctx.fillStyle = '#A0522D';  // 深棕色
    ctx.fill();
    
    ctx.restore();
}

// 绘制鱼的函数
function drawFish(x, y, width, height, color, direction) {
    ctx.save();
    ctx.translate(x + width/2, y + height/2);
    ctx.scale(direction === 'left' ? -1 : 1, 1);
    
    // 鱼身
    ctx.beginPath();
    ctx.moveTo(-width/2, 0);
    ctx.quadraticCurveTo(0, -height/2, width/2, 0);
    ctx.quadraticCurveTo(0, height/2, -width/2, 0);
    ctx.fillStyle = color;
    ctx.fill();
    
    // 鱼尾
    ctx.beginPath();
    ctx.moveTo(-width/2, 0);
    ctx.lineTo(-width/2 - width/4, -height/4);
    ctx.lineTo(-width/2 - width/4, height/4);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    
    // 鱼眼
    ctx.beginPath();
    ctx.arc(width/4, -height/6, height/8, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width/4, -height/6, height/16, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    
    ctx.restore();
}

// 绘制游戏场景
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw water surface (top 20%)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.2);
    gradient.addColorStop(0, '#87CEEB');  // 浅蓝色
    gradient.addColorStop(1, '#1E90FF');  // 深蓝色
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.2);

    // Draw ocean (middle 70%)
    ctx.fillStyle = '#00008B';  // 深蓝色
    ctx.fillRect(0, canvas.height * 0.2, canvas.width, canvas.height * 0.7);

    // Draw seabed (bottom 10%)
    ctx.fillStyle = '#8B4513';  // 棕色
    ctx.fillRect(0, canvas.height * 0.9, canvas.width, canvas.height * 0.1);

    // Draw boat
    const boatY = canvas.height * 0.2 - gameState.boat.height / 2;
    drawBoat(gameState.boat.x, boatY, gameState.boat.width, gameState.boat.height, gameState.boat.shakeAngle);

    // Draw fishes
    gameState.fishes.forEach(fish => {
        drawFish(fish.x, fish.y, fish.width, fish.height, fish.color, fish.direction.x < 0 ? 'left' : 'right');
    });

    // Draw hook and line if casting
    if (gameState.hook.isCasting || gameState.hook.isReeling) {
        ctx.beginPath();
        ctx.moveTo(gameState.boat.x + gameState.boat.width / 2, boatY + gameState.boat.height / 2);
        ctx.lineTo(gameState.hook.x, gameState.hook.y);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw hook
        ctx.beginPath();
        ctx.arc(gameState.hook.x, gameState.hook.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
    }

    // Draw caught fish if any
    if (gameState.hook.caughtFish) {
        drawFish(
            gameState.hook.caughtFish.x,
            gameState.hook.caughtFish.y,
            gameState.hook.caughtFish.width,
            gameState.hook.caughtFish.height,
            gameState.hook.caughtFish.color,
            gameState.hook.caughtFish.direction.x < 0 ? 'left' : 'right'
        );
    }

    // Draw UI
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText(`目标: ${gameState.targetFishCount - gameState.currentFishCount}条鱼`, 10, 30);
    ctx.fillText(`剩余晃动次数: ${gameState.shakeCount}`, 10, 60);
}

// Calculate upgrade costs
function calculateUpgradeCost(level) {
    return Math.floor(100 * Math.pow(1.5, level));  // Base cost 100, increases by 50% each level
}

// Update UI elements
function updateUI() {
    goldAmount.textContent = gameState.gold;
    currentLineLength.textContent = gameState.lineLength;
    currentRodStrength.textContent = gameState.rodStrength;
    fishCount.textContent = gameState.targetFishCount - gameState.currentFishCount;
    shakesLeft.textContent = gameState.shakeCount;
    
    // Update upgrade button costs
    const lineCost = calculateUpgradeCost(gameState.lineUpgradeLevel);
    const rodCost = calculateUpgradeCost(gameState.rodUpgradeLevel);
    upgradeLineButton.textContent = `升级鱼线 (${lineCost}金币)`;
    upgradeRodButton.textContent = `升级鱼竿 (${rodCost}金币)`;
}

// Generate a random fish
function generateFish() {
    // 使用加权随机选择，让大鱼出现的概率更高
    const weights = [2.6, 2.4, 2.2, 2, 1.8, 1.6, 1.4, 1.2, 1]; // 权重数组，越大的鱼权重越高
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    let selectedIndex = 0;
    for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            selectedIndex = i;
            break;
        }
    }
    
    const fishType = fishTypes[selectedIndex];
    const size = fishType.size * 20; // 基础大小乘以20作为实际大小
    
    return {
        ...fishType,
        x: Math.random() * (canvas.width - size),
        y: canvas.height * 0.2 + Math.random() * (canvas.height * 0.7 - size),
        width: size,
        height: size / 2,
        direction: randomDirection(),
        speed: fishType.speed,
        state: 'move',
        stateTimer: randomStateTime('move'),
        directionChangeTimer: randomDirectionTime()
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

// 添加缓动函数
function easeOutQuad(t) {
    return t * (2 - t);
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
    startScene.classList.add('hidden');
    gameScene.classList.remove('hidden');
    initGame();
    gameLoop();
});

upgradeLineButton.addEventListener('click', () => {
    const upgradeCost = calculateUpgradeCost(gameState.lineUpgradeLevel);
    if (gameState.gold >= upgradeCost) {
        gameState.gold -= upgradeCost;
        gameState.lineLength += 50;
        gameState.lineUpgradeLevel++;
        updateUI();
    }
});

upgradeRodButton.addEventListener('click', () => {
    const upgradeCost = calculateUpgradeCost(gameState.rodUpgradeLevel);
    if (gameState.gold >= upgradeCost) {
        gameState.gold -= upgradeCost;
        gameState.rodStrength += 50;
        gameState.rodUpgradeLevel++;
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
    gameState.lineUpgradeLevel = 0;  // Reset upgrade levels
    gameState.rodUpgradeLevel = 0;   // Reset upgrade levels
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

// Initialize fish table
function initializeFishTable() {
    fishTableBody.innerHTML = '';
    fishTypes.forEach((fish, index) => {
        const row = document.createElement('tr');
        
        // 创建用于绘制鱼的canvas
        const fishCanvas = document.createElement('canvas');
        fishCanvas.width = 60;
        fishCanvas.height = 30;
        const fishCtx = fishCanvas.getContext('2d');
        
        // 绘制鱼
        fishCtx.save();
        fishCtx.translate(fishCanvas.width/2, fishCanvas.height/2);
        
        // 鱼身
        fishCtx.beginPath();
        fishCtx.moveTo(-fishCanvas.width/3, 0);
        fishCtx.quadraticCurveTo(0, -fishCanvas.height/2, fishCanvas.width/3, 0);
        fishCtx.quadraticCurveTo(0, fishCanvas.height/2, -fishCanvas.width/3, 0);
        fishCtx.fillStyle = fish.color;
        fishCtx.fill();
        
        // 鱼尾
        fishCtx.beginPath();
        fishCtx.moveTo(-fishCanvas.width/3, 0);
        fishCtx.lineTo(-fishCanvas.width/2, -fishCanvas.height/4);
        fishCtx.lineTo(-fishCanvas.width/2, fishCanvas.height/4);
        fishCtx.closePath();
        fishCtx.fillStyle = fish.color;
        fishCtx.fill();
        
        // 鱼眼
        fishCtx.beginPath();
        fishCtx.arc(fishCanvas.width/6, -fishCanvas.height/6, fishCanvas.height/8, 0, Math.PI * 2);
        fishCtx.fillStyle = 'white';
        fishCtx.fill();
        fishCtx.beginPath();
        fishCtx.arc(fishCanvas.width/6, -fishCanvas.height/6, fishCanvas.height/16, 0, Math.PI * 2);
        fishCtx.fillStyle = 'black';
        fishCtx.fill();
        
        fishCtx.restore();
        
        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    ${fishCanvas.outerHTML}
                    ${fish.name}
                </div>
            </td>
            <td>${fish.price}</td>
            <td>${fish.weight}</td>
        `;
        fishTableBody.appendChild(row);
    });
}

// Initialize the game
initializeFishTable();
updateUI(); 