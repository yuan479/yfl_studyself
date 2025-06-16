class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.images = {};
        this.loadImages();
    }

    loadImages() {
        const imageNames = ['crocodile', 'duck', 'lava', 'rock', 'soil', 'water_source'];
        imageNames.forEach(name => {
            this.images[name] = new Image();
            this.images[name].src = `assets/images/${name}.png`;
        });
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawTerrain(terrain) {
        terrain.forEach(tile => {
            switch (tile.type) {
                case 'rock':
                    this.ctx.fillStyle = '#7f8c8d';
                    break;
                case 'soil':
                    this.ctx.fillStyle = '#d35400';
                    break;
                case 'lava':
                    this.ctx.fillStyle = '#e74c3c';
                    break;
                default:
                    this.ctx.fillStyle = '#95a5a6';
            }
            this.ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
        });
    }

    drawFluids(particles) {
        particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            
            switch (particle.type) {
                case 'water':
                    this.ctx.fillStyle = 'rgba(74, 144, 226, 0.6)';
                    break;
                case 'poison':
                    this.ctx.fillStyle = 'rgba(155, 89, 182, 0.6)';
                    break;
                case 'sludge':
                    this.ctx.fillStyle = 'rgba(39, 174, 96, 0.6)';
                    break;
                case 'steam':
                    this.ctx.fillStyle = 'rgba(236, 240, 241, 0.4)';
                    break;
                case 'explosion':
                    this.ctx.fillStyle = `rgba(231, 76, 60, ${particle.lifetime})`;
                    break;
            }
            
            this.ctx.fill();
        });
    }

    drawGameElements(elements) {
        elements.forEach(element => {
            switch (element.type) {
                case 'crocodile':
                    this.drawImage('crocodile', element.x, element.y);
                    break;
                case 'duck':
                    this.drawImage('duck', element.x, element.y);
                    break;
                case 'water_source':
                    this.drawImage('water_source', element.x, element.y);
                    break;
            }
        });
    }

    drawImage(name, x, y) {
        const img = this.images[name];
        if (img && img.complete) {
            this.ctx.drawImage(img, x, y);
        }
    }

    drawUI(gameState) {
        // Draw water level
        const waterLevel = gameState.waterLevel || 0;
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`水量: ${Math.floor(waterLevel)}%`, 10, 30);

        // Draw duck count
        const duckCount = gameState.duckCount || 0;
        this.ctx.fillText(`鸭子: ${duckCount}/3`, 10, 50);

        // Draw level number
        this.ctx.fillText(`关卡: ${gameState.levelNumber}`, 10, 70);
    }

    drawDigPreview(startX, startY, endX, endY) {
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
    }
} 