class PhysicsEngine {
    constructor() {
        this.gravity = 9.8;
        this.particles = [];
        this.grid = [];
        this.gridSize = 20; // Size of each grid cell
    }

    init(width, height) {
        this.width = width;
        this.height = height;
        this.gridWidth = Math.ceil(width / this.gridSize);
        this.gridHeight = Math.ceil(height / this.gridSize);
        this.resetGrid();
    }

    resetGrid() {
        this.grid = Array(this.gridWidth).fill().map(() => 
            Array(this.gridHeight).fill().map(() => [])
        );
    }

    addParticle(particle) {
        this.particles.push(particle);
        this.updateGrid();
    }

    updateGrid() {
        this.resetGrid();
        this.particles.forEach(particle => {
            const gridX = Math.floor(particle.x / this.gridSize);
            const gridY = Math.floor(particle.y / this.gridSize);
            if (gridX >= 0 && gridX < this.gridWidth && gridY >= 0 && gridY < this.gridHeight) {
                this.grid[gridX][gridY].push(particle);
            }
        });
    }

    update(deltaTime) {
        this.particles.forEach(particle => {
            // Apply gravity
            if (particle.type !== 'steam') {
                particle.velocity.y += this.gravity * deltaTime;
            } else {
                particle.velocity.y -= this.gravity * 0.5 * deltaTime; // Steam rises
            }

            // Update position
            particle.x += particle.velocity.x * deltaTime;
            particle.y += particle.velocity.y * deltaTime;

            // Boundary checks
            if (particle.x < 0) particle.x = 0;
            if (particle.x > this.width) particle.x = this.width;
            if (particle.y < 0) particle.y = 0;
            if (particle.y > this.height) particle.y = this.height;

            // Apply friction
            particle.velocity.x *= 0.98;
            particle.velocity.y *= 0.98;
        });

        this.updateGrid();
        this.handleCollisions();
    }

    handleCollisions() {
        this.particles.forEach(particle => {
            const gridX = Math.floor(particle.x / this.gridSize);
            const gridY = Math.floor(particle.y / this.gridSize);

            // Check neighboring cells
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = gridX + dx;
                    const ny = gridY + dy;

                    if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
                        this.grid[nx][ny].forEach(otherParticle => {
                            if (particle !== otherParticle) {
                                this.resolveCollision(particle, otherParticle);
                            }
                        });
                    }
                }
            }
        });
    }

    resolveCollision(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = p1.radius + p2.radius;

        if (distance < minDistance) {
            // Collision response
            const angle = Math.atan2(dy, dx);
            const targetX = p1.x + Math.cos(angle) * minDistance;
            const targetY = p1.y + Math.sin(angle) * minDistance;

            const ax = (targetX - p2.x) * 0.5;
            const ay = (targetY - p2.y) * 0.5;

            p1.x -= ax;
            p1.y -= ay;
            p2.x += ax;
            p2.y += ay;

            // Handle fluid interactions
            this.handleFluidInteraction(p1, p2);
        }
    }

    handleFluidInteraction(p1, p2) {
        // Water + Lava = Steam
        if ((p1.type === 'water' && p2.type === 'lava') ||
            (p1.type === 'lava' && p2.type === 'water')) {
            p1.type = 'steam';
            p1.velocity.y = -5; // Make steam rise
        }

        // Poison + Sludge = Explosion
        if ((p1.type === 'poison' && p2.type === 'sludge') ||
            (p1.type === 'sludge' && p2.type === 'poison')) {
            // Trigger explosion effect
            this.triggerExplosion(p1.x, p1.y);
        }
    }

    triggerExplosion(x, y) {
        // Create explosion particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 5;
            const particle = {
                x: x,
                y: y,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                type: 'explosion',
                radius: 2,
                lifetime: 1.0
            };
            this.addParticle(particle);
        }
    }
} 