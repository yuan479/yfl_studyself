class LevelManager {
    constructor() {
        this.levels = this.createLevels();
        this.currentLevel = 1;
    }

    createLevels() {
        return {
            1: {
                width: 800,
                height: 600,
                waterRequired: 60,
                terrain: [
                    { type: 'rock', x: 0, y: 0, width: 800, height: 20 },
                    { type: 'rock', x: 0, y: 0, width: 20, height: 600 },
                    { type: 'rock', x: 780, y: 0, width: 20, height: 600 },
                    { type: 'rock', x: 0, y: 580, width: 800, height: 20 },
                    { type: 'soil', x: 100, y: 100, width: 600, height: 400 }
                ],
                elements: [
                    { type: 'water_source', x: 400, y: 50 },
                    { type: 'crocodile', x: 400, y: 500 },
                    { type: 'duck', x: 200, y: 300 },
                    { type: 'duck', x: 400, y: 300 },
                    { type: 'duck', x: 600, y: 300 }
                ]
            },
            2: {
                width: 800,
                height: 600,
                waterRequired: 70,
                terrain: [
                    { type: 'rock', x: 0, y: 0, width: 800, height: 20 },
                    { type: 'rock', x: 0, y: 0, width: 20, height: 600 },
                    { type: 'rock', x: 780, y: 0, width: 20, height: 600 },
                    { type: 'rock', x: 0, y: 580, width: 800, height: 20 },
                    { type: 'soil', x: 100, y: 100, width: 600, height: 400 },
                    { type: 'rock', x: 300, y: 200, width: 200, height: 50 },
                    { type: 'lava', x: 400, y: 300, width: 50, height: 50 }
                ],
                elements: [
                    { type: 'water_source', x: 200, y: 50 },
                    { type: 'crocodile', x: 600, y: 500 },
                    { type: 'duck', x: 150, y: 300 },
                    { type: 'duck', x: 450, y: 300 },
                    { type: 'duck', x: 650, y: 300 }
                ]
            }
            // Add more levels here...
        };
    }

    getCurrentLevel() {
        return this.levels[this.currentLevel];
    }

    nextLevel() {
        if (this.levels[this.currentLevel + 1]) {
            this.currentLevel++;
            return true;
        }
        return false;
    }

    resetLevel() {
        return this.levels[this.currentLevel];
    }

    getLevelNumber() {
        return this.currentLevel;
    }

    isLastLevel() {
        return !this.levels[this.currentLevel + 1];
    }
} 