// 游戏实例
let game = null;
let editor = null;

// 预设关卡数据
const builtInLevels = [
    {
        id: 'level1',
        name: '关卡 #1',
        difficulty: 1,
        grid: (() => {
            // 100x100 全部陆地，左上玩家出生，右下敌人出生
            const grid = Array(100).fill().map(() => Array(100).fill('land'));
            grid[10][10] = 'playerSpawn';
            grid[90][90] = 'enemySpawn';
            // 一些资源
            grid[20][20] = 'resource';
            grid[50][50] = 'resource';
            return grid;
        })()
    },
    {
        id: 'level2',
        name: '关卡 #2',
        difficulty: 3,
        grid: (() => {
            // 100x100，中央有水流，左右出生
            const grid = Array(100).fill().map(() => Array(100).fill('land'));
            for (let y = 40; y < 60; y++) {
                for (let x = 0; x < 100; x++) {
                    grid[y][x] = 'water';
                }
            }
            grid[10][10] = 'playerSpawn';
            grid[90][10] = 'enemySpawn';
            grid[30][50] = 'resource';
            grid[70][50] = 'resource';
            return grid;
        })()
    },
    {
        id: 'level3',
        name: '关卡 #3',
        difficulty: 5,
        grid: (() => {
            // 100x100，中央有熔岩和城墙障碍
            const grid = Array(100).fill().map(() => Array(100).fill('land'));
            for (let y = 45; y < 55; y++) {
                for (let x = 45; x < 55; x++) {
                    grid[y][x] = 'lava';
                }
            }
            for (let i = 0; i < 100; i++) {
                grid[i][70] = 'wall';
            }
            grid[10][90] = 'playerSpawn';
            grid[90][10] = 'enemySpawn';
            grid[20][20] = 'resource';
            grid[80][80] = 'resource';
            return grid;
        })()
    }
];

// 页面切换函数
function switchScreen(screenId) {
    // 隐藏所有屏幕
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // 显示目标屏幕
    document.getElementById(screenId).classList.add('active');

    // 根据屏幕类型初始化相应的功能
    switch (screenId) {
        case 'startScreen':
            // 开始界面不需要特殊初始化
            break;
        case 'createLevelScreen':
            if (!editor) {
                editor = new LevelEditor();
            }
            break;
        case 'gameScreen':
            if (!game) {
                game = new Game();
            }
            break;
    }
}

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
    // 开始游戏按钮
    document.getElementById('startGameBtn').addEventListener('click', () => {
        switchScreen('levelSelectScreen');
    });

    // 创建关卡按钮
    document.getElementById('createLevelBtn').addEventListener('click', () => {
        switchScreen('createLevelScreen');
    });

    // 返回按钮
    document.getElementById('backToStartBtn').addEventListener('click', () => {
        switchScreen('startScreen');
    });

    // 保存关卡按钮
    document.getElementById('saveLevelBtn').addEventListener('click', () => {
        if (editor) {
            editor.saveLevel();
        }
    });

    // 关卡选择
    document.getElementById('levelGrid').addEventListener('click', (e) => {
        const levelCard = e.target.closest('.level-card');
        if (levelCard) {
            const levelId = levelCard.dataset.levelId;
            loadLevel(levelId);
            switchScreen('gameScreen');
        }
    });

    // 购买单位
    document.querySelectorAll('.purchase-item').forEach(item => {
        item.addEventListener('click', () => {
            const type = item.dataset.type;
            const cost = parseInt(item.querySelector('span').textContent.match(/\d+/)[0]);
            
            if (game && game.spendResources(cost)) {
                // 创建新单位
                const unit = createUnit(type);
                if (unit) {
                    game.addUnit(unit);
                }
            }
        });
    });

    renderLevelGrid();
});

// 创建单位
function createUnit(type) {
    const spawnPoint = findSpawnPoint('player');
    if (!spawnPoint) return null;

    const unit = new Unit(spawnPoint.x, spawnPoint.y, 'player', type);

    // 根据单位类型设置属性
    switch (type) {
        case 'tank':
            unit.health = 100;
            unit.maxHealth = 100;
            unit.attack = 20;
            unit.attackRange = 3;
            unit.attackSpeed = 1;
            unit.moveSpeed = 2;
            break;
        case 'fighter':
            unit.health = 80;
            unit.maxHealth = 80;
            unit.attack = 30;
            unit.attackRange = 5;
            unit.attackSpeed = 1.5;
            unit.moveSpeed = 4;
            break;
        case 'carrier':
            unit.health = 150;
            unit.maxHealth = 150;
            unit.attack = 15;
            unit.attackRange = 3;
            unit.attackSpeed = 2;
            unit.moveSpeed = 1;
            break;
    }

    return unit;
}

// 查找出生点
function findSpawnPoint(team) {
    if (!game) return null;

    const spawnType = team === 'player' ? 'playerSpawn' : 'enemySpawn';
    const spawnCell = game.grid.flat().find(cell => cell.type === spawnType);
    
    if (spawnCell) {
        return {
            x: spawnCell.x,
            y: spawnCell.y
        };
    }

    return null;
}

// 渲染关卡选择界面
function renderLevelGrid() {
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = '';
    builtInLevels.forEach(level => {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.dataset.levelId = level.id;
        card.innerHTML = `
            <div class="level-preview"></div>
            <div class="level-info">
                <span>${level.name}</span>
                <span class="difficulty">${'★'.repeat(level.difficulty)}</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 加载关卡
function loadLevel(levelId) {
    // 查找内置关卡
    const level = builtInLevels.find(l => l.id === levelId);
    let levelData;
    if (level) {
        levelData = {
            width: 100,
            height: 100,
            grid: level.grid
        };
    } else {
        // 兼容旧逻辑
        levelData = {
            width: 100,
            height: 100,
            grid: Array(100).fill().map(() => Array(100).fill('land'))
        };
        levelData.grid[10][10] = 'playerSpawn';
        levelData.grid[90][90] = 'enemySpawn';
    }

    // 初始化游戏
    if (game) {
        // 清空现有单位
        game.units = [];
        game.buildings = [];
        // TODO: 这里应根据levelData.grid初始化地形和出生点
        // 创建初始单位
        const playerSpawn = findSpawnCell(levelData.grid, 'playerSpawn');
        const enemySpawn = findSpawnCell(levelData.grid, 'enemySpawn');
        if (playerSpawn) {
            const playerUnit = new Unit(playerSpawn.x * 32, playerSpawn.y * 32, 'player', 'tank');
            game.addUnit(playerUnit);
        }
        if (enemySpawn) {
            const enemyUnit = new Unit(enemySpawn.x * 32, enemySpawn.y * 32, 'enemy', 'tank');
            game.addUnit(enemyUnit);
        }
    }
}

function findSpawnCell(grid, type) {
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x] === type) {
                return {x, y};
            }
        }
    }
    return null;
}

// 初始化游戏
switchScreen('startScreen'); 