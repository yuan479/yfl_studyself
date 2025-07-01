// 游戏状态管理
class GameState {
    constructor() {
        this.players = [];
        this.currentRound = 0;
        this.remainingTime = 30;
        this.gameStatus = 'waiting'; // waiting, describing, voting, ended
        this.currentPlayerIndex = 0;
        this.words = {
            civilian: '', // 平民词
            undercover: '', // 卧底词
        };
        this.roles = {}; // 玩家角色分配
    }
}

// AI玩家类
class AIPlayer {
    constructor(name, role, word, angle) {
        this.name = name;
        this.role = role; // 'civilian' 或 'undercover'
        this.word = word;
        this.angle = angle; // 新增：描述角度
        this.isEliminated = false;
    }

    // 判断描述是否与已有描述重复或相似
    static isSimilar(desc, previous) {
        return previous.some(prev => prev === desc || desc.includes(prev) || prev.includes(desc));
    }

    // AI生成描述，支持传入已有描述，前端去重+句子fallback
    async generateDescription(previousDescriptions = []) {
        let tryCount = 0;
        let desc = '';
        do {
            if (tryCount < 3) {
                desc = await this._generateRawDescription(previousDescriptions, false);
            } else {
                desc = await this._generateRawDescription(previousDescriptions, true);
            }
            tryCount++;
        } while (AIPlayer.isSimilar(desc, previousDescriptions) && tryCount < 7);
        return desc;
    }

    // 实际调用大模型的描述生成，allowSentence控制是否允许完整句子
    async _generateRawDescription(previousDescriptions = [], allowSentence = false) {
        const angleTip = this.angle ? `请注意：${this.angle}，不要涉及其他角度。` : '';
        const prompt = allowSentence
            ? `你正在玩"谁是卧底"游戏，你的身份是${this.role === 'civilian' ? '平民' : '卧底'}，你拿到的词语是"${this.word}"。
${angleTip}
请用模糊但不暴露词语本身的句子完整描述，要求：
1. 不能直接说出词语本身或包含的字。
2. 只从一个角度进行模糊描述。
3. 语言要自然、生活化，像真人一样说话。
4. 如果你是卧底，要尽量模仿平民的描述风格。
5. 不要暴露你不知道词语。
6. 你的发言不能和下方所有历史发言相同或相似。
7. 如果你发现你要说的内容和已有内容重复或相似，请换一个完全不同的角度或词语。
8. 一次发言只能说一种特征,不能重复。
9. 这句话可以没有主语，但是一定要有谓语。
以下是所有历史发言，请不要和它们相似或重复：
${previousDescriptions.map((desc, idx) => `玩家${idx+1}: ${desc}`).join('\n')}
请直接输出一句自然的中文描述，不要有其他多余内容。`
            : `你正在玩"谁是卧底"游戏，你的身份是${this.role === 'civilian' ? '平民' : '卧底'}，你拿到的词语是"${this.word}"。
${angleTip}
请模糊描地述这个词语，要求：
1. 不能直接说出词语本身或包含的字。
2. 只输出短语，不要写完整句子，不要有修饰性描述。
3. 只允许你从指定角度描述，不要涉及其他角度。
4. 语言要自然、生活化，像真人一样说话。
5. 如果你是卧底，要尽量模仿平民的描述风格。
6. 不要暴露你不知道词语。
7. 你的发言不能和下方所有历史发言相同或相似。
8. 如果你发现你要说的内容和已有内容重复或相似，请换一个完全不同的角度或词语。
9. 一次发言只能说一种特征,不能重复。
10. 这句话可以没有主语，但是一定要有谓语。
以下是所有历史发言，不要和它们相似或重复：
${previousDescriptions.map((desc, idx) => `玩家${idx+1}: ${desc}`).join('\n')}
`;
        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-dcb36f3e371d4e8db05a4b96cf0d3ea5'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.85
                })
            });
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('AI描述生成失败:', error);
            return '这个东西很常见，大家都很熟悉。';
        }
    }

    // AI投票决策
    async makeVote(players, descriptions) {
        const prompt = `你是一个正在玩"谁是卧底"游戏的AI玩家。
        你的角色是${this.role === 'civilian' ? '平民' : '卧底'}。
        你拿到的词是"${this.word}"。
        以下是所有玩家的描述：
        ${descriptions.map((desc, index) => `玩家${index + 1}: ${desc}`).join('\n')}
        请分析这些描述，找出最有可能与自己的词语不同的玩家，返回玩家编号（1-6）。
        只返回数字，不要有其他文字。`;

        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-dcb36f3e371d4e8db05a4b96cf0d3ea5'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7
                })
            });
            const data = await response.json();
            return parseInt(data.choices[0].message.content);
        } catch (error) {
            console.error('AI投票决策失败:', error);
            return Math.floor(Math.random() * players.length) + 1;
        }
    }
}

// 游戏管理器
class GameManager {
    constructor() {
        this.state = new GameState();
        this.aiPlayers = [];
        this.humanPlayer = null;
        this.timer = null;
        this.selectedVote = undefined;
        this._ai5Spoken = false;
        this._humanSpoken = false;
        this.allDescriptions = [];
        this._pendingAddHumanDesc = null;
    }

    // 渲染玩家卡片
    renderPlayers() {
        const grid = document.getElementById('playerGrid');
        if (!grid) return;
        grid.innerHTML = '';
        // 渲染AI玩家
        this.aiPlayers.forEach((player, idx) => {
            const card = document.createElement('div');
            card.className = `game-card bg-gray-800 rounded-lg p-4 text-center${player.isEliminated ? ' eliminated' : ''}`;
            card.innerHTML = `
                <div class="w-16 h-16 mx-auto mb-2 rounded-full bg-primary flex items-center justify-center">
                    <i class="fas fa-user text-2xl"></i>
                </div>
                <h3 class="text-sm font-semibold">${player.name}</h3>
                <p class="${player.isEliminated ? 'text-red-500' : 'text-green-400'} text-xs">
                    ${player.isEliminated ? '已淘汰' : '在线'}
                </p>
            `;
            grid.appendChild(card);
        });
        // 渲染人类玩家
        const card = document.createElement('div');
        card.className = `game-card bg-gray-800 rounded-lg p-4 text-center${this.humanPlayer.isEliminated ? ' eliminated' : ''}`;
        card.innerHTML = `
            <div class="w-16 h-16 mx-auto mb-2 rounded-full bg-primary flex items-center justify-center">
                <i class="fas fa-user text-2xl"></i>
            </div>
            <h3 class="text-sm font-semibold">玩家</h3>
            <p class="${this.humanPlayer.isEliminated ? 'text-red-500' : 'text-green-400'} text-xs">
                ${this.humanPlayer.isEliminated ? '已淘汰' : '在线'}
            </p>
        `;
        grid.appendChild(card);
    }

    // 初始化游戏
    initializeGame() {
        // 设置词语对
        const wordPairs = [
            { civilian: '包子', undercover: '饺子' },
            { civilian: '牛奶', undercover: '豆浆' },
            { civilian: '电梯', undercover: '楼梯' },
            { civilian: '博客', undercover: '微博' },
            { civilian: '哈密瓜', undercover: '香瓜' },
            { civilian: '汉堡', undercover: '三明治' },
            { civilian: '吉他', undercover: '尤克里里' },
            { civilian: '冰箱', undercover: '空调' },
            { civilian: '西红柿', undercover: '圣女果' },
            { civilian: '唇膏', undercover: '口红' },
            { civilian: '西瓜', undercover: '哈密瓜' },
            { civilian: '橙子', undercover: '柚子' },
            { civilian: '狮子', undercover: '老虎' },
            { civilian: '兔子', undercover: '仓鼠' },
            { civilian: '企鹅', undercover: '天鹅' },
            { civilian: '玫瑰', undercover: '月季' },
            { civilian: '百合', undercover: '郁金香' },
            { civilian: '钢笔', undercover: '圆珠笔' },
            { civilian: '铅笔', undercover: '彩铅' },
            { civilian: '鼠标', undercover: '键盘' },
            { civilian: '手机', undercover: '电话' },
            { civilian: '电视', undercover: '显示器' },
            { civilian: '电脑', undercover: '平板' },
            { civilian: '飞机', undercover: '火车' },
            { civilian: '轮船', undercover: '游艇' },
            { civilian: '公交车', undercover: '地铁' },
            { civilian: '出租车', undercover: '网约车' },
            { civilian: '火锅', undercover: '烧烤' },
            { civilian: '米饭', undercover: '面条' },
            { civilian: '饼干', undercover: '蛋糕' },
            { civilian: '巧克力', undercover: '糖果' },
            { civilian: '咖啡', undercover: '奶茶' },
            { civilian: '果汁', undercover: '汽水' },
            { civilian: '篮球', undercover: '足球' },
            { civilian: '羽毛球', undercover: '乒乓球' },
            { civilian: '游泳', undercover: '冲浪' },
            { civilian: '跑步', undercover: '骑行' },
            { civilian: '瑜伽', undercover: '普拉提' },
            { civilian: '跳绳', undercover: '呼啦圈' },
            { civilian: '围棋', undercover: '象棋' },
            { civilian: '扑克', undercover: '麻将' },
            { civilian: '小说', undercover: '散文' },
            { civilian: '诗歌', undercover: '歌词' },
            { civilian: '画画', undercover: '摄影' },
            { civilian: '雕塑', undercover: '陶艺' },
            { civilian: '钢琴', undercover: '小提琴' },
            { civilian: '萨克斯', undercover: '单簧管' },
            { civilian: '电影', undercover: '电视剧' },
            { civilian: '动画片', undercover: '纪录片' },
            { civilian: '小说家', undercover: '编剧' },
            { civilian: '导演', undercover: '制片人' },
            { civilian: '老师', undercover: '教授' },
            { civilian: '医生', undercover: '护士' },
            { civilian: '警察', undercover: '保安' },
            { civilian: '律师', undercover: '法官' },
            { civilian: '学生', undercover: '学者' },
            { civilian: '老板', undercover: '经理' },
            { civilian: '秘书', undercover: '助理' },
            { civilian: '演员', undercover: '歌手' },
            { civilian: '画家', undercover: '雕塑家' },
            { civilian: '作家', undercover: '诗人' },
            { civilian: '科学家', undercover: '工程师' },
            { civilian: '程序员', undercover: '设计师' },
            { civilian: '记者', undercover: '编辑' },
            { civilian: '司机', undercover: '乘客' },
            { civilian: '厨师', undercover: '服务员' },
            { civilian: '导游', undercover: '游客' },
            { civilian: '运动员', undercover: '教练' },
            { civilian: '裁判', undercover: '观众' },
            { civilian: '老板娘', undercover: '老板' },
            { civilian: '妈妈', undercover: '爸爸' },
            { civilian: '哥哥', undercover: '弟弟' },
            { civilian: '姐姐', undercover: '妹妹' },
            { civilian: '爷爷', undercover: '奶奶' },
            { civilian: '外公', undercover: '外婆' },
            { civilian: '叔叔', undercover: '阿姨' },
            { civilian: '舅舅', undercover: '姑姑' },
            { civilian: '表哥', undercover: '表弟' },
            { civilian: '表姐', undercover: '表妹' },
            { civilian: '同学', undercover: '同事' },
            { civilian: '朋友', undercover: '闺蜜' },
            { civilian: '邻居', undercover: '房东' },
            { civilian: '老板', undercover: '员工' },
            { civilian: '顾客', undercover: '商家' },
            { civilian: '买家', undercover: '卖家' },
            { civilian: '主持人', undercover: '嘉宾' },
            { civilian: '观众', undercover: '听众' },
            { civilian: '网友', undercover: '粉丝' },
            { civilian: '网友', undercover: '主播' }
        
        ];
        
        const selectedPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
        this.state.words = selectedPair;

        // 创建AI玩家
        this.aiPlayers = [];
        const angles = [
            '只允许你从模样（外观、颜色、形状）方面描述',
            '只允许你从作用（用途、功能）方面描述',
            '只允许你从使用场景（经常出现的地方、使用的环境）方面描述',
            '只允许你从类别（类别、归属，对比）方面描述',
            '只允许你从抽象联想（感受、文学，网络热梗）方面描述'
        ];
        for (let i = 1; i <= 5; i++) {
            const role = i === 1 ? 'undercover' : 'civilian';
            const word = role === 'undercover' ? selectedPair.undercover : selectedPair.civilian;
            this.aiPlayers.push(new AIPlayer(`AI玩家${i}`, role, word, angles[i - 1]));
        }

        // 设置人类玩家（默认平民）
        this.humanPlayer = {
            name: '玩家',
            role: 'civilian',
            word: selectedPair.civilian,
            isEliminated: false,
            lastDescription: ''
        };

        // 显示玩家身份词
        const wordDiv = document.getElementById('playerWord');
        if (wordDiv) wordDiv.textContent = this.humanPlayer.word;

        this.updateUI();
        this.renderPlayers();
        this.startNewRound();
    }

    // 开始新回合
    async startNewRound() {
        this.state.currentRound++;
        this.state.gameStatus = 'describing';
        this.state.currentPlayerIndex = 0;
        this.state.remainingTime = 30;
        this.selectedVote = undefined;
        this.updateUI();
        this.renderPlayers();
        this._ai5Spoken = false;
        this._humanSpoken = false;
        this.addRoundDivider(this.state.currentRound);

        // 收集所有历史描述
        if (!this.allDescriptions) this.allDescriptions = [];
        let roundDescriptions = [];
        for (let i = 0; i < this.aiPlayers.length; i++) {
            const aiPlayer = this.aiPlayers[i];
            if (!aiPlayer.isEliminated) {
                const description = await aiPlayer.generateDescription(this.allDescriptions);
                aiPlayer.lastDescription = description;
                roundDescriptions.push(description);
                this.addMessageToChat(aiPlayer.name, description, false);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
                if (i === 4) {
                    this._ai5Spoken = true;
                    this._showVoteTipIfReady();
                }
            }
        }
        // 等待人类玩家输入
        // 玩家发言后也要加入allDescriptions
        this._pendingAddHumanDesc = () => {
            if (roundDescriptions && this.humanPlayer.lastDescription) {
                this.allDescriptions.push(this.humanPlayer.lastDescription);
            }
        };
    }

    _showVoteTipIfReady() {
        if (this._ai5Spoken && this._humanSpoken) {
            const voteTipModal = document.getElementById('voteTipModal');
            if (voteTipModal) voteTipModal.classList.remove('hidden');
            setTimeout(() => {
                if (voteTipModal) voteTipModal.classList.add('hidden');
                this.state.gameStatus = 'voting';
            }, 1000);
        }
    }

    // 处理投票
    async handleVoting() {
        this.state.gameStatus = 'voting';
        
        // 收集所有描述
        const descriptions = this.aiPlayers
            .filter(p => !p.isEliminated)
            .map(p => p.lastDescription);

        // AI玩家投票
        for (const aiPlayer of this.aiPlayers) {
            if (!aiPlayer.isEliminated) {
                const vote = await aiPlayer.makeVote(this.aiPlayers, descriptions);
                // 处理投票结果
            }
        }

        // 等待人类玩家投票
    }

    // 更新UI
    updateUI() {
        // 更新玩家状态
        this.renderPlayers();
        // 更新剩余玩家数
        const remainingPlayers = this.aiPlayers.filter(p => !p.isEliminated).length + 
            (this.humanPlayer.isEliminated ? 0 : 1);
        // 当前回合和剩余玩家数
        const roundSpans = document.querySelectorAll('.text-secondary');
        if (roundSpans.length > 0) roundSpans[0].textContent = `第 ${this.state.currentRound} 轮`;
        if (roundSpans.length > 1) roundSpans[1].textContent = `${remainingPlayers} 人`;
    }

    // 添加聊天消息
    addMessageToChat(playerName, message, isHuman = false) {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex gap-4 mb-4';
        messageDiv.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <i class="fas fa-user text-lg"></i>
            </div>
            <div class="${isHuman ? 'bubble-human' : 'bubble-ai'} rounded-lg p-3 flex-grow">
                <p class="text-sm font-semibold mb-1">${playerName}</p>
                <p>${message}</p>
            </div>
        `;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // 添加轮次分界
    addRoundDivider(roundNum) {
        const chatContainer = document.getElementById('chatContainer');
        if (!chatContainer) return;
        const divider = document.createElement('div');
        divider.className = 'bubble-round';
        divider.textContent = `第${roundNum}轮`;
        chatContainer.appendChild(divider);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // 计时器
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            this.state.remainingTime--;
            document.querySelector('.text-secondary span').textContent = 
                `${Math.floor(this.state.remainingTime / 60)}:${(this.state.remainingTime % 60).toString().padStart(2, '0')}`;
            
            if (this.state.remainingTime <= 0) {
                clearInterval(this.timer);
                this.handleVoting();
            }
        }, 1000);
    }

    // 显示投票界面
    showVotingModal() {
        const modal = document.getElementById('votingModal');
        const optionsContainer = document.getElementById('votingOptions');
        optionsContainer.innerHTML = '';

        // 添加可投票的玩家选项
        this.aiPlayers.forEach((player, index) => {
            if (!player.isEliminated) {
                const option = document.createElement('button');
                option.className = 'vote-option' + (this.selectedVote === index ? ' selected' : '');
                option.textContent = player.name;
                option.dataset.playerIndex = index;
                option.addEventListener('click', () => this.selectVote(option));
                optionsContainer.appendChild(option);
            }
        });
        modal.classList.remove('hidden');
    }

    // 选择投票对象
    selectVote(selectedOption) {
        // 移除其他选项的选中状态
        document.querySelectorAll('#votingOptions .vote-option').forEach(btn => {
            btn.classList.remove('selected');
        });
        // 设置选中状态
        selectedOption.classList.add('selected');
        this.selectedVote = parseInt(selectedOption.dataset.playerIndex);
    }

    // 处理投票结果
    async processVotingResults() {
        // 显示判定中弹窗
        const judgingModal = document.getElementById('judgingModal');
        if (judgingModal) judgingModal.classList.remove('hidden');
        // 判定逻辑
        const votes = new Map();
        // 收集AI玩家的投票
        for (const aiPlayer of this.aiPlayers) {
            if (!aiPlayer.isEliminated) {
                const vote = await aiPlayer.makeVote(this.aiPlayers, this.getCurrentDescriptions());
                votes.set(aiPlayer.name, vote);
            }
        }
        // 添加人类玩家的投票
        if (this.selectedVote !== undefined && !this.humanPlayer.isEliminated) {
            votes.set('玩家', this.selectedVote);
        }
        // 统计票数
        const voteCount = new Map();
        for (const [voter, target] of votes) {
            const targetPlayer = target === -1 ? '玩家' : this.aiPlayers[target].name;
            voteCount.set(targetPlayer, (voteCount.get(targetPlayer) || 0) + 1);
        }
        // 找出得票最多的玩家
        let maxVotes = 0;
        let eliminatedPlayer = null;
        for (const [player, count] of voteCount) {
            if (count > maxVotes) {
                maxVotes = count;
                eliminatedPlayer = player;
            }
        }
        // 处理淘汰
        if (eliminatedPlayer === '玩家') {
            this.humanPlayer.isEliminated = true;
        } else {
            const aiIndex = this.aiPlayers.findIndex(p => p.name === eliminatedPlayer);
            if (aiIndex !== -1) {
                this.aiPlayers[aiIndex].isEliminated = true;
            }
        }
        // 检查游戏是否结束
        this.checkGameEnd();
        // 判定结束后关闭判定弹窗
        if (judgingModal) judgingModal.classList.add('hidden');
    }

    // 获取当前所有描述
    getCurrentDescriptions() {
        return this.aiPlayers
            .filter(p => !p.isEliminated)
            .map(p => p.lastDescription);
    }

    // 检查游戏是否结束
    checkGameEnd() {
        const remainingCivilians = this.aiPlayers.filter(p => !p.isEliminated && p.role === 'civilian').length +
            (!this.humanPlayer.isEliminated && this.humanPlayer.role === 'civilian' ? 1 : 0);
        const remainingUndercover = this.aiPlayers.filter(p => !p.isEliminated && p.role === 'undercover').length;

        let gameEnded = false;
        let winner = '';

        if (remainingUndercover === 0) {
            gameEnded = true;
            winner = '平民';
        } else if (remainingCivilians <= remainingUndercover) {
            gameEnded = true;
            winner = '卧底';
        }

        if (gameEnded) {
            this.showGameResult(winner);
        } else {
            this.startNewRound();
        }
    }

    // 显示游戏结果
    showGameResult(winner) {
        const modal = document.getElementById('resultModal');
        const title = document.getElementById('resultTitle');
        const message = document.getElementById('resultMessage');

        title.textContent = `${winner}阵营获胜！`;
        message.textContent = `平民词：${this.state.words.civilian}\n卧底词：${this.state.words.undercover}`;

        modal.classList.remove('hidden');
    }

    // 开始新游戏
    startNewGame() {
        // 重置游戏状态
        this.state = new GameState();
        this.aiPlayers = [];
        this.humanPlayer = null;
        this.timer = null;

        // 隐藏结果弹窗
        document.getElementById('resultModal').classList.add('hidden');

        // 重新初始化游戏
        this.initializeGame();
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const gameManager = new GameManager();
    gameManager.initializeGame();

    // 绑定发送按钮事件
    const sendButton = document.getElementById('sendButton');
    const inputField = document.getElementById('messageInput');

    if (sendButton && inputField) {
        sendButton.addEventListener('click', () => {
            const message = inputField.value.trim();
            if (message) {
                gameManager.addMessageToChat('玩家', message, true);
                gameManager.humanPlayer.lastDescription = message;
                inputField.value = '';
                if (gameManager.state.gameStatus === 'describing') {
                    gameManager._humanSpoken = true;
                    if (typeof gameManager._pendingAddHumanDesc === 'function') {
                        gameManager._pendingAddHumanDesc();
                        gameManager._pendingAddHumanDesc = null;
                    }
                    gameManager._showVoteTipIfReady();
                }
            }
        });

        // 添加回车键发送功能
        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });
    }

    // 绑定投票按钮事件
    const voteButton = document.getElementById('voteButton');
    if (voteButton) {
        voteButton.addEventListener('click', () => {
            if (gameManager.state.gameStatus === 'voting') {
                gameManager.showVotingModal();
            }
        });
    }

    // 绑定确认投票按钮事件
    const confirmVoteButton = document.getElementById('confirmVote');
    if (confirmVoteButton) {
        confirmVoteButton.addEventListener('click', () => {
            if (gameManager.selectedVote !== undefined) {
                document.getElementById('votingModal').classList.add('hidden');
                gameManager.processVotingResults();
            }
        });
    }

    // 绑定新游戏按钮事件
    const newGameButton = document.getElementById('newGame');
    if (newGameButton) {
        newGameButton.addEventListener('click', () => {
            gameManager.startNewGame();
        });
    }

    // 绑定规则按钮事件
    const rulesButton = document.getElementById('rulesButton');
    if (rulesButton) {
        rulesButton.addEventListener('click', () => {
            // 显示规则弹窗
            alert('游戏规则：\n1. 每轮玩家需要描述自己拿到的词语\n2. 不能直接说出词语\n3. 卧底需要模仿平民的描述\n4. 每轮结束后进行投票\n5. 平民需要找出卧底，卧底需要隐藏身份');
        });
    }

    // 绑定投票提示弹窗按钮
    const voteTipConfirm = document.getElementById('voteTipConfirm');
    if (voteTipConfirm) {
        voteTipConfirm.addEventListener('click', () => {
            document.getElementById('voteTipModal').classList.add('hidden');
            gameManager.showVotingModal();
        });
    }
}); 