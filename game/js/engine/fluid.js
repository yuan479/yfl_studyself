class FluidSystem {
    constructor(physicsEngine) {
        this.physicsEngine = physicsEngine;
        this.fluids = {
            water: { color: '#4a90e2', density: 1.0, viscosity: 0.1 },
            poison: { color: '#9b59b6', density: 1.2, viscosity: 0.15 },
            sludge: { color: '#27ae60', density: 1.5, viscosity: 0.3 },
            steam: { color: '#ecf0f1', density: 0.3, viscosity: 0.05 }
        };
    }

    createFluidParticle(x, y, type) {
        const fluid = this.fluids[type];
        if (!fluid) return null;

        return {
            x: x,
            y: y,
            type: type,
            color: fluid.color,
            radius: 4,
            velocity: { x: 0, y: 0 },
            density: fluid.density,
            viscosity: fluid.viscosity
        };
    }

    spawnFluid(x, y, type, count = 10) {
        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 10;
            const offsetY = (Math.random() - 0.5) * 10;
            const particle = this.createFluidParticle(x + offsetX, y + offsetY, type);
            if (particle) {
                this.physicsEngine.addParticle(particle);
            }
        }
    }

    update() {
        // Remove particles that have been converted or destroyed
        this.physicsEngine.particles = this.physicsEngine.particles.filter(particle => {
            if (particle.type === 'explosion') {
                particle.lifetime -= 0.016; // Assuming 60fps
                return particle.lifetime > 0;
            }
            return true;
        });
    }

    getFluidColor(type) {
        return this.fluids[type]?.color || '#000000';
    }

    // Special interactions between different fluid types
    handleFluidInteraction(particle1, particle2) {
        const types = [particle1.type, particle2.type].sort();
        
        // Water + Lava = Steam
        if (types[0] === 'lava' && types[1] === 'water') {
            particle1.type = 'steam';
            particle2.type = 'steam';
            particle1.velocity.y = -5;
            particle2.velocity.y = -5;
        }
        
        // Poison + Sludge = Explosion
        if (types[0] === 'poison' && types[1] === 'sludge') {
            this.physicsEngine.triggerExplosion(
                (particle1.x + particle2.x) / 2,
                (particle1.y + particle2.y) / 2
            );
            particle1.type = 'explosion';
            particle2.type = 'explosion';
        }
    }
} 