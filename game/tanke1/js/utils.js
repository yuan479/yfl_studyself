// 工具类函数
const Utils = {
    // 随机数生成
    random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    // 计算两点之间的距离
    distance: (x1, y1, x2, y2) => Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),

    // 碰撞检测
    checkCollision: (rect1, rect2) => {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    // 角度计算
    calculateAngle: (x1, y1, x2, y2) => {
        return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    },

    // 加载图片
    loadImage: (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    },

    // 加载音频
    loadAudio: (src) => {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = reject;
            audio.src = src;
        });
    },

    // 创建动画帧
    createAnimation: (frames, duration) => {
        return {
            frames,
            duration,
            currentFrame: 0,
            timer: 0,
            update: function(deltaTime) {
                this.timer += deltaTime;
                if (this.timer >= this.duration / this.frames.length) {
                    this.timer = 0;
                    this.currentFrame = (this.currentFrame + 1) % this.frames.length;
                }
                return this.frames[this.currentFrame];
            }
        };
    },

    // 创建粒子效果
    createParticle: (x, y, color, size, speed, life) => {
        return {
            x,
            y,
            color,
            size,
            speed,
            life,
            maxLife: life,
            update: function(deltaTime) {
                this.life -= deltaTime;
                this.size *= 0.99;
                return this.life > 0;
            },
            draw: function(ctx) {
                const alpha = this.life / this.maxLife;
                ctx.fillStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };
    },

    // 创建爆炸效果
    createExplosion: (x, y, size, color) => {
        const particles = [];
        const particleCount = 20;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Utils.random(2, 5);
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Utils.random(size/2, size),
                color,
                life: 1
            });
        }

        return {
            particles,
            update: function(deltaTime) {
                this.particles = this.particles.filter(particle => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    particle.size *= 0.95;
                    particle.life -= deltaTime * 2;
                    return particle.life > 0;
                });
                return this.particles.length > 0;
            },
            draw: function(ctx) {
                this.particles.forEach(particle => {
                    ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        };
    },

    // 创建伤害数字效果
    createDamageNumber: (x, y, damage, color = '#ff0000') => {
        return {
            x,
            y,
            damage,
            color,
            life: 1,
            update: function(deltaTime) {
                this.y -= deltaTime * 50;
                this.life -= deltaTime * 2;
                return this.life > 0;
            },
            draw: function(ctx) {
                ctx.fillStyle = `${this.color}${Math.floor(this.life * 255).toString(16).padStart(2, '0')}`;
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.damage.toString(), this.x, this.y);
            }
        };
    },

    // 创建寻路网格
    createPathfindingGrid: (width, height, cellSize) => {
        const grid = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push({
                    x: x * cellSize,
                    y: y * cellSize,
                    walkable: true,
                    f: 0,
                    g: 0,
                    h: 0,
                    parent: null
                });
            }
            grid.push(row);
        }
        return grid;
    },

    // A*寻路算法
    findPath: (grid, startX, startY, endX, endY) => {
        const openSet = [];
        const closedSet = new Set();
        const start = grid[startY][startX];
        const end = grid[endY][endX];
        
        openSet.push(start);
        
        while (openSet.length > 0) {
            let current = openSet[0];
            let currentIndex = 0;
            
            // 找到f值最小的节点
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < current.f) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }
            
            // 到达目标
            if (current === end) {
                const path = [];
                let temp = current;
                while (temp.parent) {
                    path.push({x: temp.x, y: temp.y});
                    temp = temp.parent;
                }
                return path.reverse();
            }
            
            // 从开放列表中移除当前节点
            openSet.splice(currentIndex, 1);
            closedSet.add(current);
            
            // 检查相邻节点
            const neighbors = [];
            const directions = [
                {x: 0, y: -1}, // 上
                {x: 1, y: 0},  // 右
                {x: 0, y: 1},  // 下
                {x: -1, y: 0}  // 左
            ];
            
            for (const dir of directions) {
                const newX = current.x / grid[0][0].x + dir.x;
                const newY = current.y / grid[0][0].y + dir.y;
                
                if (newX >= 0 && newX < grid[0].length && 
                    newY >= 0 && newY < grid.length) {
                    const neighbor = grid[newY][newX];
                    if (neighbor.walkable && !closedSet.has(neighbor)) {
                        neighbors.push(neighbor);
                    }
                }
            }
            
            for (const neighbor of neighbors) {
                const tentativeG = current.g + 1;
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeG >= neighbor.g) {
                    continue;
                }
                
                neighbor.parent = current;
                neighbor.g = tentativeG;
                neighbor.h = Utils.distance(neighbor.x, neighbor.y, end.x, end.y);
                neighbor.f = neighbor.g + neighbor.h;
            }
        }
        
        return null; // 没有找到路径
    }
}; 