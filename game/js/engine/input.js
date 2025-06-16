class InputHandler {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.isDigging = false;
        this.lastPos = { x: 0, y: 0 };
        this.currentTool = 'dig'; // 'dig' or 'place'

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Add keyboard controls
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    getMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    handleMouseDown(event) {
        const pos = this.getMousePosition(event);
        this.lastPos = pos;

        if (event.button === 0) { // Left click
            this.isDigging = true;
            this.game.startDigging(pos.x, pos.y);
        } else if (event.button === 2) { // Right click
            this.game.placeTool(pos.x, pos.y);
        }
    }

    handleMouseMove(event) {
        const pos = this.getMousePosition(event);
        
        if (this.isDigging) {
            this.game.continueDigging(this.lastPos.x, this.lastPos.y, pos.x, pos.y);
            this.lastPos = pos;
        }
    }

    handleMouseUp(event) {
        if (event.button === 0) { // Left click
            this.isDigging = false;
            this.game.stopDigging();
        }
    }

    handleKeyDown(event) {
        switch (event.key) {
            case ' ': // Space bar
                this.game.resetWater();
                break;
            case 'r': // R key
                this.game.resetLevel();
                break;
            case '1': // Number keys for tools
                this.currentTool = 'dig';
                break;
            case '2':
                this.currentTool = 'place';
                break;
            case 'Escape':
                this.game.toggleMenu();
                break;
        }
    }

    setTool(tool) {
        this.currentTool = tool;
    }
} 