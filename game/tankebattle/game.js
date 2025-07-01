// 游戏参数
const GRID_COLS = 20;
const GRID_ROWS = 15;
// CELL_SIZE 由实际场地宽度动态计算
let CELL_SIZE = 40;

const gameArea = document.getElementById('game-area');
const levelSpan = document.getElementById('level');
const lifeSpan = document.getElementById('life');

// 解析关卡参数
const urlParams = new URLSearchParams(window.location.search);
let level = parseInt(urlParams.get('level')) || 1;
levelSpan.textContent = level;

// 地图数据结构
let map = [];

// 玩家位置
let playerPos = { x: 2, y: 1 };

// 玩家朝向（初始向右）
let playerDir = { x: 1, y: 0 };

// 敌人数据结构，支持多个敌人，增加hp属性
let enemies = [];

// 生成空地图
function generateEmptyMap() {
    map = [];
    for (let y = 0; y < GRID_ROWS; y++) {
        let row = [];
        for (let x = 0; x < GRID_COLS; x++) {
            row.push({ type: 'empty' });
        }
        map.push(row);
    }
}

// 静态布局：四周灰墙，入口左上，出口右下，随机白墙，玩家、敌人
function generateStaticMap() {
    generateEmptyMap();
    // 灰色墙壁
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            if (y === 0 || y === GRID_ROWS-1 || x === 0 || x === GRID_COLS-1) {
                map[y][x].type = 'wall';
            }
        }
    }
    // 入口
    map[1][1].type = 'entry';
    // 出口
    map[GRID_ROWS-2][GRID_COLS-2].type = 'exit';
    // 玩家坦克，左上角（入口旁）
    map[1][2].type = 'player';
    // 敌人坦克，数量随关卡递增，不能生成在入口、出口、墙、可破坏墙、玩家上
    let enemyCount = Math.min(2 + Math.floor(level/2), 8);
    let placed = 0;
    while (placed < enemyCount) {
        let ex = Math.floor(Math.random() * (GRID_COLS-4)) + 2;
        let ey = Math.floor(Math.random() * (GRID_ROWS-4)) + 2;
        if ([ 'empty' ].includes(map[ey][ex].type)) {
            // 不与玩家、入口、出口重叠
            if ((ex === 1 && ey === 1) || (ex === 1 && ey === 2) || (ex === GRID_COLS-2 && ey === GRID_ROWS-2)) continue;
            map[ey][ex].type = 'enemy';
            placed++;
        }
    }
    // 随机白色可破坏墙，数量随关卡递增，不能生成在入口、出口、玩家、敌人上
    let breakableCount = 30 + level*8;
    let bplaced = 0;
    while (bplaced < breakableCount) {
        let rx = Math.floor(Math.random() * (GRID_COLS-2)) + 1;
        let ry = Math.floor(Math.random() * (GRID_ROWS-2)) + 1;
        if (map[ry][rx].type === 'empty') {
            // 不在入口、出口、玩家、敌人上
            if ((rx === 1 && ry === 1) || (rx === 1 && ry === 2) || (rx === GRID_COLS-2 && ry === GRID_ROWS-2)) continue;
            if (map[ry][rx].type === 'enemy') continue;
            map[ry][rx].type = 'breakable';
            bplaced++;
        }
    }
}

// 炮弹数组
let bullets = [];

// 监听键盘事件，增加朝向变更
window.addEventListener('keydown', function(e) {
    let dx = 0, dy = 0;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') { dy = -1; playerDir = {x:0, y:-1}; }
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') { dy = 1; playerDir = {x:0, y:1}; }
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') { dx = -1; playerDir = {x:-1, y:0}; }
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') { dx = 1; playerDir = {x:1, y:0}; }
    if (dx !== 0 || dy !== 0) {
        movePlayer(dx, dy);
    }
});

function movePlayer(dx, dy) {
    const nx = playerPos.x + dx;
    const ny = playerPos.y + dy;
    if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) return;
    const target = map[ny][nx].type;
    if (['empty', 'entry', 'exit'].includes(target)) {
        // 清除原位置
        map[playerPos.y][playerPos.x].type = 'empty';
        // 移动
        playerPos.x = nx;
        playerPos.y = ny;
        map[ny][nx].type = 'player';
        renderMap();
        // 到达出口
        if (target === 'exit') {
            setTimeout(() => {
                if (confirm('恭喜通关！进入下一关？')) {
                    level++;
                    levelSpan.textContent = level;
                    playerLife = 6;
                    lifeSpan.textContent = playerLife;
                    init();
                } else {
                    window.location.href = 'start.html';
                }
            }, 100);
        }
    }
}

// 定时器句柄
let bulletTimer, renderTimer, enemyMoveTimer, enemyShootTimer;

function startGameLoops() {
    // 防止重复启动
    if (bulletTimer) clearInterval(bulletTimer);
    if (renderTimer) clearInterval(renderTimer);
    if (enemyMoveTimer) clearInterval(enemyMoveTimer);
    if (enemyShootTimer) clearInterval(enemyShootTimer);
    bulletTimer = setInterval(shootBullet, 1000);
    renderTimer = setInterval(() => {
        updateBullets();
        updateEnemyBullets();
        renderMap();
    }, 50);
    enemyMoveTimer = setInterval(updateEnemies, 500);
    enemyShootTimer = setInterval(enemyShoot, 2000);
}

// 发射炮弹
function shootBullet() {
    if (!map || !map[0]) return;
    // 炮弹起点在玩家前方一格
    const bx = playerPos.x + playerDir.x;
    const by = playerPos.y + playerDir.y;
    // 不能在墙上生成
    if (bx < 0 || bx >= GRID_COLS || by < 0 || by >= GRID_ROWS) return;
    if (['wall'].includes(map[by][bx].type)) return;
    bullets.push({ x: bx, y: by, dx: playerDir.x, dy: playerDir.y });
}

// 炮弹移动与碰撞
function updateBullets() {
    let newBullets = [];
    for (let bullet of bullets) {
        let nx = bullet.x + bullet.dx;
        let ny = bullet.y + bullet.dy;
        if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
        let t = map[ny][nx].type;
        if (t === 'wall') continue;
        if (t === 'breakable') {
            map[ny][nx].type = 'empty';
            continue;
        }
        if (t === 'enemy') {
            // 找到该敌人
            let enemy = enemies.find(e => e.x === nx && e.y === ny);
            if (enemy) {
                enemy.hp--;
                if (enemy.hp <= 0) {
                    map[ny][nx].type = 'empty';
                    // 移除敌人
                    enemies = enemies.filter(e => !(e.x === nx && e.y === ny));
                }
            }
            continue;
        }
        // 其余情况继续飞行
        newBullets.push({ x: nx, y: ny, dx: bullet.dx, dy: bullet.dy });
    }
    bullets = newBullets;
}

// 初始化
function init() {
    generateStaticMap();
    enemies = [];
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            if (map[y][x].type === 'player') {
                playerPos = { x, y };
            }
            if (map[y][x].type === 'enemy') {
                enemies.push({ x, y, dir: { x: 0, y: 1 }, cooldown: 0, hp: 4 });
            }
        }
    }
    renderMap();
}

// 敌人AI移动，不能与玩家或其他敌人重叠
function updateEnemies() {
    for (let enemy of enemies) {
        // 简单AI：如果和玩家在同一行/列且中间无障碍，则朝玩家移动，否则随机移动
        let dx = 0, dy = 0;
        if (enemy.x === playerPos.x) {
            let step = enemy.y < playerPos.y ? 1 : -1;
            let blocked = false;
            for (let y = enemy.y + step; y !== playerPos.y; y += step) {
                if ([ 'wall', 'breakable', 'enemy', 'player' ].includes(map[y][enemy.x].type)) { blocked = true; break; }
            }
            if (!blocked) dy = step;
        } else if (enemy.y === playerPos.y) {
            let step = enemy.x < playerPos.x ? 1 : -1;
            let blocked = false;
            for (let x = enemy.x + step; x !== playerPos.x; x += step) {
                if ([ 'wall', 'breakable', 'enemy', 'player' ].includes(map[enemy.y][x].type)) { blocked = true; break; }
            }
            if (!blocked) dx = step;
        }
        // 如果不能直线追踪，则随机移动
        if (dx === 0 && dy === 0) {
            let dirs = [ [0,1], [0,-1], [1,0], [-1,0] ];
            dirs = dirs.filter(([mx,my]) => {
                let tx = enemy.x + mx, ty = enemy.y + my;
                if (tx < 0 || tx >= GRID_COLS || ty < 0 || ty >= GRID_ROWS) return false;
                let t = map[ty][tx].type;
                return [ 'empty', 'entry', 'exit' ].includes(t) && !(tx === playerPos.x && ty === playerPos.y) && !enemies.some(e => e.x === tx && e.y === ty);
            });
            if (dirs.length > 0) {
                let [mx,my] = dirs[Math.floor(Math.random()*dirs.length)];
                dx = mx; dy = my;
            }
        }
        // 移动，不能与玩家或其他敌人重叠
        if (dx !== 0 || dy !== 0) {
            let nx = enemy.x + dx, ny = enemy.y + dy;
            if ([ 'empty', 'entry', 'exit' ].includes(map[ny][nx].type) && !(nx === playerPos.x && ny === playerPos.y) && !enemies.some(e => e !== enemy && e.x === nx && e.y === ny)) {
                map[enemy.y][enemy.x].type = 'empty';
                enemy.x = nx; enemy.y = ny;
                map[ny][nx].type = 'enemy';
            }
        }
    }
}

// 敌人自动射击
let enemyBullets = [];
function enemyShoot() {
    for (let enemy of enemies) {
        // 朝玩家方向发射（优先直线）
        let dx = 0, dy = 0;
        if (enemy.x === playerPos.x) dy = playerPos.y > enemy.y ? 1 : -1;
        else if (enemy.y === playerPos.y) dx = playerPos.x > enemy.x ? 1 : -1;
        else {
            // 随机方向
            let dirs = [ [0,1], [0,-1], [1,0], [-1,0] ];
            [dx,dy] = dirs[Math.floor(Math.random()*dirs.length)];
        }
        let bx = enemy.x + dx, by = enemy.y + dy;
        if (bx < 0 || bx >= GRID_COLS || by < 0 || by >= GRID_ROWS) continue;
        if (['wall'].includes(map[by][bx].type)) continue;
        enemyBullets.push({ x: bx, y: by, dx, dy });
    }
}

// 敌人炮弹移动与碰撞
function updateEnemyBullets() {
    let newBullets = [];
    for (let bullet of enemyBullets) {
        let nx = bullet.x + bullet.dx;
        let ny = bullet.y + bullet.dy;
        if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
        let t = map[ny][nx].type;
        if (t === 'wall') continue;
        if (t === 'breakable') {
            map[ny][nx].type = 'empty';
            continue;
        }
        if (t === 'player') {
            // 玩家受伤
            playerHurt();
            continue;
        }
        newBullets.push({ x: nx, y: ny, dx: bullet.dx, dy: bullet.dy });
    }
    enemyBullets = newBullets;
}

// 玩家受伤
let playerLife = 6;
function playerHurt() {
    playerLife--;
    lifeSpan.textContent = playerLife;
    if (playerLife <= 0) {
        alert('游戏失败！');
        window.location.href = 'start.html';
    }
}

// 渲染地图到 DOM，CELL_SIZE自适应
function renderMap() {
    if (!map || !map[0]) return;
    // 计算CELL_SIZE
    const area = document.getElementById('game-area');
    let w = area.offsetWidth, h = area.offsetHeight;
    CELL_SIZE = Math.floor(Math.min(w / GRID_COLS, h / GRID_ROWS));
    gameArea.innerHTML = '';
    gameArea.style.width = (CELL_SIZE * GRID_COLS) + 'px';
    gameArea.style.height = (CELL_SIZE * GRID_ROWS) + 'px';
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.style.width = CELL_SIZE + 'px';
            cell.style.height = CELL_SIZE + 'px';
            cell.style.boxSizing = 'border-box';
            cell.style.position = 'relative';
            switch(map[y][x].type) {
                case 'wall':
                    cell.classList.add('wall');
                    break;
                case 'breakable':
                    cell.classList.add('breakable');
                    break;
                case 'entry':
                    cell.classList.add('entry');
                    cell.innerHTML = '<span style="font-size:22px;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#0a0;">&#8594;</span>';
                    break;
                case 'exit':
                    cell.classList.add('exit');
                    cell.innerHTML = '<span style="font-size:22px;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#00f;">&#128682;</span>';
                    break;
                case 'player':
                    cell.classList.add('player');
                    break;
                case 'enemy':
                    cell.classList.add('enemy');
                    break;
            }
            // 渲染玩家炮弹
            if (bullets.some(b => b.x === x && b.y === y)) {
                const bulletDiv = document.createElement('div');
                bulletDiv.style.width = Math.max(8, Math.floor(CELL_SIZE/4)) + 'px';
                bulletDiv.style.height = Math.max(8, Math.floor(CELL_SIZE/4)) + 'px';
                bulletDiv.style.background = '#fff';
                bulletDiv.style.borderRadius = '50%';
                bulletDiv.style.position = 'absolute';
                bulletDiv.style.left = '50%';
                bulletDiv.style.top = '50%';
                bulletDiv.style.transform = 'translate(-50%, -50%)';
                bulletDiv.style.boxShadow = '0 0 4px #000';
                cell.appendChild(bulletDiv);
            }
            // 渲染敌人炮弹
            if (enemyBullets.some(b => b.x === x && b.y === y)) {
                const bulletDiv = document.createElement('div');
                bulletDiv.style.width = Math.max(8, Math.floor(CELL_SIZE/4)) + 'px';
                bulletDiv.style.height = Math.max(8, Math.floor(CELL_SIZE/4)) + 'px';
                bulletDiv.style.background = '#f44';
                bulletDiv.style.borderRadius = '50%';
                bulletDiv.style.position = 'absolute';
                bulletDiv.style.left = '50%';
                bulletDiv.style.top = '50%';
                bulletDiv.style.transform = 'translate(-50%, -50%)';
                bulletDiv.style.boxShadow = '0 0 4px #a00';
                cell.appendChild(bulletDiv);
            }
            gameArea.appendChild(cell);
        }
    }
}

// CSS（建议加到 game.html 的 <style> 里）
// .cell { border: 1px solid #ccc; float: left; }
// .wall { background: #888; }
// .breakable { background: #fff; border: 1px dashed #aaa; }
// .entry { background: #0f0; }
// .exit { background: #00f; }
// .player { background: #0a0; border: 2px solid #fff; }
// .enemy { background: #a00; border: 2px solid #fff; }

// 监听窗口resize自适应
window.addEventListener('resize', () => { if (map && map[0]) renderMap(); });

// 启动入口
window.addEventListener('DOMContentLoaded', () => {
    init();
    startGameLoops();
}); 