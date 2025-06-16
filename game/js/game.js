class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize game systems
        this.physicsEngine = new PhysicsEngine();
        this.fluidSystem = new FluidSystem(this.physicsEngine);
        this.renderer = new Renderer(this.canvas);
        this.inputHandler = new InputHandler(this.canvas, this);
        this.levelManager = new LevelManager();
        
        // Game state
        this.isRunning = false;
        this.isDigging = false;
        this.waterLevel = 0;
        this.duckCount = 0;
        this.lastTime = 0;
        
        // Initialize the first level
        this.loadLevel(this.levelManager.getCurrentLevel());
        
        // Start the game loop
        this.start();
    }

    loadLevel(level) {
        // Set canvas size
        this.canvas.width = level.width;
        this.canvas.height = level.height;
        
        // Initialize physics engine
        this.physicsEngine.init(level.width, level.height);
        
        // Store level data
        this.currentLevel = level;
        this.terrain = level.terrain;
        this.elements = level.elements;
        this.waterRequired = level.waterRequired;
        
        // Reset game state
        this.waterLevel = 0;
        this.duckCount = 0;
    }

    start() {
        this.isRunning = true;
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(timestamp) {
        if (!this.isRunning) return;

        // Calculate delta time
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // Update game state
        this.update(deltaTime);

        // Render game
        this.render();

        // Continue game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // Update physics
        this.physicsEngine.update(deltaTime);
        
        // Update fluid system
        this.fluidSystem.update();
        
        // Check for level completion
        this.checkLevelCompletion();
        
        // Update water level
        this.updateWaterLevel();
    }

    render() {
        // Clear canvas
        this.renderer.clear();
        
        // Draw game elements
        this.renderer.drawBackground();
        this.renderer.drawTerrain(this.terrain);
        this.renderer.drawFluids(this.physicsEngine.particles);
        this.renderer.drawGameElements(this.elements);
        
        // Draw UI
        this.renderer.drawUI({
            waterLevel: this.waterLevel,
            duckCount: this.duckCount,
            levelNumber: this.levelManager.getLevelNumber()
        });
    }

    startDigging(x, y) {
        this.isDigging = true;
        this.digStartX = x;
        this.digStartY = y;
    }

    continueDigging(startX, startY, endX, endY) {
        if (!this.isDigging) return;
        
        // Calculate dig path
        const path = this.calculateDigPath(startX, startY, endX, endY);
        
        // Remove soil along path
        path.forEach(point => {
            this.removeSoil(point.x, point.y);
        });
    }

    stopDigging() {
        this.isDigging = false;
    }

    calculateDigPath(startX, startY, endX, endY) {
        const points = [];
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / 5);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            points.push({
                x: startX + dx * t,
                y: startY + dy * t
            });
        }
        
        return points;
    }

    removeSoil(x, y) {
        // Find and remove soil at the given position
        this.terrain = this.terrain.filter(tile => {
            if (tile.type === 'soil' &&
                x >= tile.x && x <= tile.x + tile.width &&
                y >= tile.y && y <= tile.y + tile.height) {
                return false;
            }
            return true;
        });
    }

    updateWaterLevel() {
        // Calculate water level based on particles in the crocodile's area
        const crocodile = this.elements.find(e => e.type === 'crocodile');
        if (!crocodile) return;

        const waterParticles = this.physicsEngine.particles.filter(p => 
            p.type === 'water' &&
            Math.abs(p.x - crocodile.x) < 50 &&
            Math.abs(p.y - crocodile.y) < 50
        );

        this.waterLevel = (waterParticles.length / 100) * 100;
    }

    checkLevelCompletion() {
        if (this.waterLevel >= this.waterRequired) {
            // Level completed
            if (this.levelManager.nextLevel()) {
                this.loadLevel(this.levelManager.getCurrentLevel());
            } else {
                // Game completed
                this.showGameComplete();
            }
        }
    }

    resetWater() {
        // Remove all water particles
        this.physicsEngine.particles = this.physicsEngine.particles.filter(p => p.type !== 'water');
        this.waterLevel = 0;
    }

    resetLevel() {
        this.loadLevel(this.levelManager.resetLevel());
    }

    showGameComplete() {
        // Show game complete screen
        this.isRunning = false;
        alert('恭喜你完成了所有关卡！');
    }

    toggleMenu() {
        // Toggle pause menu
        this.isRunning = !this.isRunning;
        if (this.isRunning) {
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 