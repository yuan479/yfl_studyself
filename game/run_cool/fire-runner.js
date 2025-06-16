class Game {
    constructor() {
        this.player = {
            x: 200,
            y: 300,
            speedX: 0,
            speedY: 0,
            isJumping: false,
            element: document.getElementById('player')
        };
        
        this.gameLoop = this.gameLoop.bind(this);
        this.initControls();
        this.generateInitialPlatforms();
        requestAnimationFrame(this.gameLoop);
    }

    initControls() {
        document.addEventListener('keydown', (e) => {
            if(e.code === 'Space') this.jump();
            if(e.code === 'ArrowRight') this.player.speedX = 5;
            if(e.code === 'ArrowLeft') this.player.speedX = -5;
        });
    }

    jump() {
        if(!this.player.isJumping) {
            this.player.speedY = -15;
            this.player.isJumping = true;
        }
    }

    gameLoop() {
        // 物理模拟
        this.player.speedY += 0.8; // 重力
        this.player.y += this.player.speedY;
        this.player.x += this.player.speedX;

        // 地面碰撞
        if(this.player.y > 300) {
            this.player.y = 300;
            this.player.speedY = 0;
            this.player.isJumping = false;
        }

        // 更新角色位置
        this.player.element.style.transform = 
            `translate(${this.player.x}px, ${this.player.y}px)`;

        requestAnimationFrame(this.gameLoop);
    }

    generateInitialPlatforms() {
        // 平台生成逻辑
        for(let i = 0; i < 5; i++) {
            const platform = document.createElement('div');
            platform.className = 'platform';
            platform.style.width = `${100 + Math.random()*200}px`;
            platform.style.left = `${i*400}px`;
            platform.style.top = `${350 + Math.random()*100}px`;
            document.getElementById('game-container').appendChild(platform);
        }
    }
}

// 启动游戏
new Game();