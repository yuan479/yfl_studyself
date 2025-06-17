// 游戏主类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resources = 1000;
        this.units = [];
        this.buildings = [];
        this.projectiles = [];
        this.effects = [];
        this.selectedUnit = null;
        this.grid = null;
        this.lastTime = 0;
        this.isPaused = false;

        // 初始化游戏
        this.init();
    }

    init() {
        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 初始化事件监听
        this.initEventListeners();

        // 初始化寻路网格
        this.initPathfindingGrid();

        // 开始游戏循环
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    initEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // 键盘事件
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    initPathfindingGrid() {
        const cellSize = 32; // 每个格子的大小
        const width = Math.floor(this.canvas.width / cellSize);
        const height = Math.floor(this.canvas.height / cellSize);
        this.grid = Utils.createPathfindingGrid(width, height, cellSize);
    }

    gameLoop(currentTime = 0) {
        if (!this.isPaused) {
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            this.update(deltaTime);
            this.render();
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // 更新单位
        this.units.forEach(unit => unit.update(deltaTime, this));

        // 更新建筑
        this.buildings.forEach(building => building.update(deltaTime, this));

        // 更新投射物
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime);
            return !projectile.isDestroyed;
        });

        // 更新特效
        this.effects = this.effects.filter(effect => {
            effect.update(deltaTime);
            return effect.isActive;
        });

        // 检查胜利/失败条件
        this.checkGameState();
    }

    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制地形
        this.renderTerrain();

        // 绘制建筑
        this.buildings.forEach(building => building.render(this.ctx));

        // 绘制单位
        this.units.forEach(unit => unit.render(this.ctx));

        // 绘制投射物
        this.projectiles.forEach(projectile => projectile.render(this.ctx));

        // 绘制特效
        this.effects.forEach(effect => effect.render(this.ctx));

        // 绘制选中效果
        if (this.selectedUnit) {
            this.renderSelection();
        }
    }

    renderTerrain() {
        // 绘制网格
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += 32) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += 32) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    renderSelection() {
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.selectedUnit.x - 2,
            this.selectedUnit.y - 2,
            this.selectedUnit.width + 4,
            this.selectedUnit.height + 4
        );

        // 绘制攻击范围
        if (this.selectedUnit.attackRange > 0) {
            this.ctx.beginPath();
            this.ctx.arc(
                this.selectedUnit.x + this.selectedUnit.width / 2,
                this.selectedUnit.y + this.selectedUnit.height / 2,
                this.selectedUnit.attackRange,
                0,
                Math.PI * 2
            );
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.fill();
        }
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 检查是否点击了单位
        const clickedUnit = this.units.find(unit => {
            return x >= unit.x && x <= unit.x + unit.width &&
                   y >= unit.y && y <= unit.y + unit.height;
        });

        if (clickedUnit) {
            this.selectedUnit = clickedUnit;
        } else {
            // 如果点击了空地，移动选中的单位
            if (this.selectedUnit) {
                this.moveUnit(this.selectedUnit, x, y);
            }
        }
    }

    handleMouseMove(e) {
        // 处理鼠标移动事件
    }

    handleMouseUp(e) {
        // 处理鼠标释放事件
    }

    handleKeyDown(e) {
        switch (e.key) {
            case 'Escape':
                this.selectedUnit = null;
                break;
            case ' ':
                this.isPaused = !this.isPaused;
                break;
        }
    }

    moveUnit(unit, targetX, targetY) {
        // 计算目标格子坐标
        const targetGridX = Math.floor(targetX / 32);
        const targetGridY = Math.floor(targetY / 32);
        const currentGridX = Math.floor(unit.x / 32);
        const currentGridY = Math.floor(unit.y / 32);

        // 使用A*寻路
        const path = Utils.findPath(this.grid, currentGridX, currentGridY, targetGridX, targetGridY);
        
        if (path) {
            unit.setPath(path);
        }
    }

    addUnit(unit) {
        this.units.push(unit);
    }

    addBuilding(building) {
        this.buildings.push(building);
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    addEffect(effect) {
        this.effects.push(effect);
    }

    checkGameState() {
        // 检查是否所有敌方单位都被消灭
        const enemyUnits = this.units.filter(unit => unit.team === 'enemy');
        if (enemyUnits.length === 0) {
            this.handleVictory();
        }

        // 检查是否所有我方单位都被消灭
        const playerUnits = this.units.filter(unit => unit.team === 'player');
        if (playerUnits.length === 0) {
            this.handleDefeat();
        }
    }

    handleVictory() {
        this.isPaused = true;
        // 显示胜利界面
        alert('胜利！');
    }

    handleDefeat() {
        this.isPaused = true;
        // 显示失败界面
        alert('失败！');
    }

    // 资源管理
    addResources(amount) {
        this.resources += amount;
        document.getElementById('resourceAmount').textContent = this.resources;
    }

    spendResources(amount) {
        if (this.resources >= amount) {
            this.resources -= amount;
            document.getElementById('resourceAmount').textContent = this.resources;
            return true;
        }
        return false;
    }
}

// 单位基类
class Unit {
    constructor(x, y, team, type) {
        this.x = x;
        this.y = y;
        this.team = team;
        this.type = type;
        this.width = 32;
        this.height = 32;
        this.health = 100;
        this.maxHealth = 100;
        this.attack = 20;
        this.attackRange = 3;
        this.attackSpeed = 1;
        this.moveSpeed = 2;
        this.path = [];
        this.target = null;
        this.lastAttackTime = 0;
    }

    update(deltaTime, game) {
        // 移动逻辑
        if (this.path.length > 0) {
            const target = this.path[0];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.moveSpeed) {
                this.path.shift();
            } else {
                this.x += (dx / distance) * this.moveSpeed;
                this.y += (dy / distance) * this.moveSpeed;
            }
        }

        // 攻击逻辑
        if (this.target) {
            const distance = Utils.distance(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.target.x + this.target.width / 2,
                this.target.y + this.target.height / 2
            );

            if (distance <= this.attackRange * 32) {
                if (Date.now() - this.lastAttackTime >= 1000 / this.attackSpeed) {
                    this.attackTarget(game);
                    this.lastAttackTime = Date.now();
                }
            } else {
                this.target = null;
            }
        }
    }

    render(ctx) {
        // 绘制单位
        ctx.fillStyle = this.team === 'player' ? '#0000ff' : '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 绘制血条
        this.renderHealthBar(ctx);
    }

    renderHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const healthPercentage = this.health / this.maxHealth;

        // 背景
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);

        // 当前血量
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y - 8, barWidth * healthPercentage, barHeight);
    }

    setPath(path) {
        this.path = path;
    }

    setTarget(target) {
        this.target = target;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    attackTarget(game) {
        if (this.target) {
            const isDestroyed = this.target.takeDamage(this.attack);
            
            // 创建伤害数字效果
            game.addEffect(Utils.createDamageNumber(
                this.target.x + this.target.width / 2,
                this.target.y,
                this.attack
            ));

            if (isDestroyed) {
                // 创建爆炸效果
                game.addEffect(Utils.createExplosion(
                    this.target.x + this.target.width / 2,
                    this.target.y + this.target.height / 2,
                    32,
                    '#ff0000'
                ));

                // 移除被摧毁的单位
                const index = game.units.indexOf(this.target);
                if (index > -1) {
                    game.units.splice(index, 1);
                }

                this.target = null;
            }
        }
    }
}

// 建筑基类
class Building {
    constructor(x, y, team, type) {
        this.x = x;
        this.y = y;
        this.team = team;
        this.type = type;
        this.width = 64;
        this.height = 64;
        this.health = 200;
        this.maxHealth = 200;
        this.attack = 25;
        this.attackRange = 4;
        this.attackSpeed = 1;
        this.target = null;
        this.lastAttackTime = 0;
    }

    update(deltaTime, game) {
        // 自动寻找目标
        if (!this.target) {
            const enemyUnits = game.units.filter(unit => unit.team !== this.team);
            if (enemyUnits.length > 0) {
                // 找到最近的目标
                let closestUnit = enemyUnits[0];
                let minDistance = Infinity;

                enemyUnits.forEach(unit => {
                    const distance = Utils.distance(
                        this.x + this.width / 2,
                        this.y + this.height / 2,
                        unit.x + unit.width / 2,
                        unit.y + unit.height / 2
                    );

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestUnit = unit;
                    }
                });

                if (minDistance <= this.attackRange * 32) {
                    this.target = closestUnit;
                }
            }
        }

        // 攻击逻辑
        if (this.target) {
            const distance = Utils.distance(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.target.x + this.target.width / 2,
                this.target.y + this.target.height / 2
            );

            if (distance <= this.attackRange * 32) {
                if (Date.now() - this.lastAttackTime >= 1000 / this.attackSpeed) {
                    this.attackTarget(game);
                    this.lastAttackTime = Date.now();
                }
            } else {
                this.target = null;
            }
        }
    }

    render(ctx) {
        // 绘制建筑
        ctx.fillStyle = this.team === 'player' ? '#0000ff' : '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 绘制血条
        this.renderHealthBar(ctx);
    }

    renderHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const healthPercentage = this.health / this.maxHealth;

        // 背景
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);

        // 当前血量
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y - 8, barWidth * healthPercentage, barHeight);
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    attackTarget(game) {
        if (this.target) {
            const isDestroyed = this.target.takeDamage(this.attack);
            
            // 创建伤害数字效果
            game.addEffect(Utils.createDamageNumber(
                this.target.x + this.target.width / 2,
                this.target.y,
                this.attack
            ));

            if (isDestroyed) {
                // 创建爆炸效果
                game.addEffect(Utils.createExplosion(
                    this.target.x + this.target.width / 2,
                    this.target.y + this.target.height / 2,
                    32,
                    '#ff0000'
                ));

                // 移除被摧毁的单位
                const index = game.units.indexOf(this.target);
                if (index > -1) {
                    game.units.splice(index, 1);
                }

                this.target = null;
            }
        }
    }
} 