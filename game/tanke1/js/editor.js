// 关卡编辑器类
class LevelEditor {
    constructor() {
        this.canvas = document.getElementById('levelEditor');
        this.ctx = this.canvas.getContext('2d');
        this.grid = [];
        this.selectedElement = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.cellSize = 32;
        this.gridWidth = 100;
        this.gridHeight = 100;

        // 初始化编辑器
        this.init();
    }

    init() {
        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 初始化网格
        this.initGrid();

        // 初始化事件监听
        this.initEventListeners();

        // 初始化元素选择
        this.initElementSelection();

        // 开始渲染循环
        this.render();
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            const row = [];
            for (let x = 0; x < this.gridWidth; x++) {
                row.push({
                    type: 'land',
                    x: x * this.cellSize,
                    y: y * this.cellSize
                });
            }
            this.grid.push(row);
        }
    }

    initEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // 右键菜单
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
    }

    initElementSelection() {
        const elements = document.querySelectorAll('.element');
        elements.forEach(element => {
            element.addEventListener('click', () => {
                // 移除其他元素的选中状态
                elements.forEach(el => el.classList.remove('selected'));
                // 添加当前元素的选中状态
                element.classList.add('selected');
                // 设置选中的元素类型
                this.selectedElement = element.dataset.type;
            });
        });
    }

    handleMouseDown(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;

        // 放置元素
        this.placeElement(this.lastX, this.lastY);
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 计算移动距离
        const dx = x - this.lastX;
        const dy = y - this.lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果移动距离足够大，放置新元素
        if (distance >= this.cellSize / 2) {
            this.placeElement(x, y);
            this.lastX = x;
            this.lastY = y;
        }
    }

    handleMouseUp() {
        this.isDrawing = false;
    }

    handleRightClick(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 擦除元素
        this.eraseElement(x, y);
    }

    placeElement(x, y) {
        if (!this.selectedElement) return;

        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);

        // 检查边界
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return;
        }

        // 特殊规则检查
        if (this.selectedElement === 'playerSpawn' || this.selectedElement === 'enemySpawn') {
            // 检查是否已经存在出生点
            const existingSpawn = this.grid.flat().find(cell => cell.type === this.selectedElement);
            if (existingSpawn) {
                existingSpawn.type = 'land';
            }
        }

        // 放置元素
        this.grid[gridY][gridX].type = this.selectedElement;
    }

    eraseElement(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);

        // 检查边界
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return;
        }

        // 擦除元素
        this.grid[gridY][gridX].type = 'land';
    }

    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        this.renderGrid();

        // 绘制元素
        this.renderElements();

        // 继续渲染循环
        requestAnimationFrame(() => this.render());
    }

    renderGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        // 绘制垂直线
        for (let x = 0; x <= this.canvas.width; x += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y <= this.canvas.height; y += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    renderElements() {
        this.grid.forEach(row => {
            row.forEach(cell => {
                switch (cell.type) {
                    case 'land':
                        this.ctx.fillStyle = '#4a752c';
                        break;
                    case 'water':
                        this.ctx.fillStyle = '#1e90ff';
                        break;
                    case 'lava':
                        this.ctx.fillStyle = '#ff4500';
                        break;
                    case 'wall':
                        this.ctx.fillStyle = '#8b4513';
                        break;
                    case 'resource':
                        this.ctx.fillStyle = '#ffd700';
                        break;
                    case 'defense':
                        this.ctx.fillStyle = '#808080';
                        break;
                    case 'playerSpawn':
                        this.ctx.fillStyle = '#0000ff';
                        break;
                    case 'enemySpawn':
                        this.ctx.fillStyle = '#ff0000';
                        break;
                }

                this.ctx.fillRect(cell.x, cell.y, this.cellSize, this.cellSize);
            });
        });
    }

    // 保存关卡
    saveLevel() {
        const levelData = {
            width: this.gridWidth,
            height: this.gridHeight,
            grid: this.grid.map(row => row.map(cell => cell.type))
        };

        // 转换为JSON字符串
        const jsonString = JSON.stringify(levelData);

        // 创建Blob对象
        const blob = new Blob([jsonString], { type: 'application/json' });

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `level_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 加载关卡
    loadLevel(jsonString) {
        try {
            const levelData = JSON.parse(jsonString);
            
            // 验证数据
            if (!levelData.width || !levelData.height || !levelData.grid) {
                throw new Error('Invalid level data');
            }

            // 更新网格大小
            this.gridWidth = levelData.width;
            this.gridHeight = levelData.height;

            // 重新初始化网格
            this.initGrid();

            // 加载数据
            levelData.grid.forEach((row, y) => {
                row.forEach((type, x) => {
                    this.grid[y][x].type = type;
                });
            });

            return true;
        } catch (error) {
            console.error('Error loading level:', error);
            return false;
        }
    }
} 