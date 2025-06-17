// 词库示例，可自行扩展
const WORD_PAIRS = [
    { civilian: '苹果', undercover: '梨' },
    { civilian: '猫', undercover: '老虎' },
    { civilian: '篮球', undercover: '足球' },
    { civilian: '飞机', undercover: '火箭' },
    { civilian: '西瓜', undercover: '哈密瓜' },
    { civilian: '饺子', undercover: '包子' },
    { civilian: '长城', undercover: '故宫' },
    { civilian: '钢琴', undercover: '吉他' },
    { civilian: '企鹅', undercover: '海豚' },
    { civilian: '咖啡', undercover: '奶茶' },
    { civilian: '狮子', undercover: '老虎' },
    { civilian: '火锅', undercover: '烧烤' },
    { civilian: '月亮', undercover: '太阳' },
    { civilian: '沙漠', undercover: '草原' },
    { civilian: '手机', undercover: '平板' },
    { civilian: '超人', undercover: '蜘蛛侠' },
    { civilian: '冰箱', undercover: '空调' },
    { civilian: '巧克力', undercover: '奶酪' },
    { civilian: '火车', undercover: '地铁' },
    { civilian: '玫瑰', undercover: '郁金香' },
    { civilian: '西红柿', undercover: '辣椒' },
    { civilian: '大象', undercover: '犀牛' },
    { civilian: '鼠标', undercover: '键盘' },
    { civilian: '诗歌', undercover: '小说' },
    { civilian: '篮球', undercover: '排球' },
    { civilian: '牛奶', undercover: '酸奶' },
    { civilian: '火箭', undercover: '导弹' },
    { civilian: '电视', undercover: '投影仪' },
    { civilian: '面包', undercover: '蛋糕' },
    { civilian: '自行车', undercover: '摩托车' },
    { civilian: '橙子', undercover: '柚子' },
    { civilian: '乌龟', undercover: '蜗牛' },
    { civilian: '冰淇淋', undercover: '雪糕' },
    { civilian: '地图', undercover: '导航' },
    { civilian: '游泳', undercover: '潜水' },
    { civilian: '羽毛球', undercover: '乒乓球' },
    { civilian: '火柴', undercover: '打火机' },
    { civilian: '电梯', undercover: '扶梯' },
    { civilian: '雨伞', undercover: '雨衣' },
    { civilian: '汉堡', undercover: '热狗' },
    { civilian: '星星', undercover: '流星' }
];

const AI_NAMES = ['小明', '小红', '小刚'];
let players = [];
let undercoverIndex = 0;
let wordPair = null;
let round = 1;
let gameOver = false;
const playerName = '我';

const setupDiv = document.getElementById('setup');
const startBtn = document.getElementById('startBtn');
const playerNameInput = document.getElementById('playerName');
const gameArea = document.getElementById('gameArea');
const roleInfo = document.getElementById('roleInfo');
const descArea = document.getElementById('descArea');
const descList = document.getElementById('descList');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const voteArea = document.getElementById('voteArea');
const voteList = document.getElementById('voteList');
const voteBtn = document.getElementById('voteBtn');
const resultArea = document.getElementById('resultArea');

const AVATAR_ME = 'https://img1.imgtp.com/2023/07/21/0QwQwKQv.png'; // 可换成本地图片
const AVATAR_AI = 'https://img1.imgtp.com/2023/07/21/0QwQwKQv.png'; // 可换成本地图片

window.onload = () => {
    startGame();
};

function startGame() {
    // 初始化
    setupDiv.style.display = 'none';
    gameArea.style.display = '';
    resultArea.innerHTML = '';
    round = 1;
    gameOver = false;
    // 随机词语
    wordPair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    // 随机卧底
    undercoverIndex = Math.floor(Math.random() * 4);
    // 分配玩家
    players = [
        { name: playerName, isAI: false, desc: '', vote: -1, out: false },
        ...AI_NAMES.map(n => ({ name: n, isAI: true, desc: '', vote: -1, out: false }))
    ];
    // 分配词语
    players.forEach((p, i) => {
        p.word = (i === undercoverIndex) ? wordPair.undercover : wordPair.civilian;
    });
    showRoleInfo();
    startDescribe();
}

function showRoleInfo() {
    const me = players[0];
    roleInfo.innerHTML = `你的词语：<b>${me.word}</b>  ${undercoverIndex === 0 ? '' : ''}`;
}

function startDescribe() {
    document.getElementById('chatArea').style.display = '';
    // 不再清空 chatBox，聊天消息会一直保留
    voteArea.style.display = 'none';
    nextRoundBtn.style.display = 'none';
    // 激活输入栏
    document.getElementById('chatInputBar').style.display = '';
    document.getElementById('descInput').value = '';
    document.getElementById('descInput').focus();
    document.getElementById('descSubmit').onclick = () => {
        const val = document.getElementById('descInput').value.trim();
        if (!val) return alert('请描述你的词语！');
        players[0].desc = val;
        appendChatBubble('我', val, 'right');
        document.getElementById('descInput').value = '';
        document.getElementById('chatInputBar').style.display = 'none';
        aiChatDescribe(1);
    };
}

function appendChatBubble(name, text, side) {
    const chatBox = document.getElementById('chatBox');
    const row = document.createElement('div');
    row.className = 'bubble-row ' + (side === 'right' ? 'right' : 'left');
    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + (side === 'right' ? 'me' : 'ai');
    bubble.innerHTML = `<span class="name">${name}</span>${text}`;
    row.appendChild(bubble);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function aiChatDescribe(idx) {
    if (idx >= players.length) {
        setTimeout(startVote, 500);
        return;
    }
    const player = players[idx];
    if (!player.isAI || player.out) {
        aiChatDescribe(idx + 1);
        return;
    }
    appendChatBubble(player.name, '<span class="ai-wait">AI思考中...</span>', 'left');
    const chatBox = document.getElementById('chatBox');
    const bubble = chatBox.lastChild.querySelector('.bubble');
    getAIDesc(player.word, getDescHistory(), (desc) => {
        player.desc = desc;
        bubble.innerHTML = `<span class="name">${player.name}</span>${desc}`;
        chatBox.scrollTop = chatBox.scrollHeight;
        setTimeout(() => aiChatDescribe(idx + 1), 800);
    });
}

function getDescHistory() {
    // 返回本轮已描述内容
    return players.map(p => p.desc).filter(Boolean);
}

function getAIDesc(word, history, cb) {
    fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-96c2e1584e234e01a135bfa2d41d2f0a'
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: '你正在玩"谁是卧底"游戏。请用一句话模糊地描述你的词语，不能直接说出词语本身，也不能出现"我的词语是..."等字样。描述风格要多样，有的简短有的详细，可以用个人体验、场景、感受、用途、联想、常见搭配等方式表达，让人不容易直接猜到词语。必须避免和历史描述内容重复或相似，每个人的描述都要用不同的角度、细节或表达方式，而且每个人只能说一个特性，偶尔可以抽象地描述。'
                },
                {
                    role: 'user',
                    content: `词语：${word}。历史描述：${history.join('，')}`
                }
            ],
            temperature: 0.95
        })
    })
    .then(res => res.json())
    .then(data => {
        cb(data.choices?.[0]?.message?.content || 'AI描述出错');
    })
    .catch(() => {
        cb('AI描述出错');
    });
}

function startVote() {
    voteArea.style.display = '';
    voteList.innerHTML = '';
    voteBtn.style.display = '';
    nextRoundBtn.style.display = 'none';
    // 只显示未出局玩家
    const alive = players.filter(p => !p.out);
    // 玩家投票
    voteList.innerHTML = alive.map((p, i) =>
        `<label><input type="radio" name="vote" value="${i}"> ${p.name}</label>`
    ).join('<br>');
    voteBtn.onclick = () => {
        const val = document.querySelector('input[name="vote"]:checked');
        if (!val) return alert('请选择要投票的人！');
        players[0].vote = parseInt(val.value);
        // 显示判定中提示
        resultArea.innerHTML = '<span style="color:#90caf9;">正在判定，请稍后......</span>';
        // AI 投票
        aiVote(alive, 1);
    };
}

function aiVote(alive, idx) {
    if (idx >= alive.length) {
        // 统计票数
        setTimeout(countVote, 500);
        return;
    }
    const ai = alive[idx];
    if (!ai.isAI) {
        aiVote(alive, idx + 1);
        return;
    }
    // 这里调用 deepseek API 获取投票对象
    getAIVote(ai, alive, (voteIdx) => {
        ai.vote = voteIdx;
        aiVote(alive, idx + 1);
    });
}

function getAIVote(ai, alive, cb) {
    const descList = alive.map(p => `${p.name}:${p.desc}`).join('\n');
    fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-96c2e1584e234e01a135bfa2d41d2f0a'
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: '你是一个谁是卧底游戏助手，请根据所有人的描述，判断谁最可能是卧底，只返回ta的名字。' },
                { role: 'user', content: `描述列表：\n${descList}` }
            ],
            temperature: 0.7
        })
    })
    .then(res => res.json())
    .then(data => {
        const name = data.choices?.[0]?.message?.content?.trim();
        const idx = alive.findIndex(p => p.name === name);
        cb(idx >= 0 ? idx : 0); // 找不到就投第一个
    })
    .catch(() => {
        // 出错时随机投票（不投自己）
        let idx;
        do {
            idx = Math.floor(Math.random() * alive.length);
        } while (alive[idx].name === ai.name);
        cb(idx);
    });
}

function countVote() {
    // 统计票数
    const alive = players.filter(p => !p.out);
    const votes = Array(alive.length).fill(0);
    alive.forEach((p, i) => {
        votes[p.vote]++;
    });
    // 找到票数最多的人
    let maxVote = Math.max(...votes);
    let outIdxs = votes.map((v, i) => v === maxVote ? i : -1).filter(i => i !== -1);
    // 若多人并列，随机淘汰其中一人
    const outIdx = outIdxs[Math.floor(Math.random() * outIdxs.length)];
    const outPlayer = alive[outIdx];
    outPlayer.out = true;
    // 判定结束后显示结果和投票详情
    setTimeout(() => {
        let resultHtml = `${outPlayer.name} 被淘汰！${undercoverIndex === players.indexOf(outPlayer) ? '（卧底）' : ''}`;
        // 投票详情
        resultHtml += '<div style="margin-top:12px;text-align:left;font-size:15px;line-height:1.8;">';
        alive.forEach((p, i) => {
            const target = alive[p.vote]?.name || '无效';
            resultHtml += `<span style="color:#09bb07;font-weight:bold;">${p.name}</span> 投给了 <span style="color:#222;">${target}</span><br>`;
        });
        resultHtml += '</div>';
        resultArea.innerHTML = resultHtml;
        // 检查胜负
        setTimeout(checkGameOver, 1200);
    }, 1000);
}

function checkGameOver() {
    const alive = players.filter(p => !p.out);
    const undercoverAlive = alive.some((p, i) => i === undercoverIndex);
    if (!undercoverAlive) {
        let resultHtml = '卧底已被淘汰，平民获胜！';
        // 展示所有玩家的词语
        resultHtml += '<div style="margin-top:14px;text-align:left;font-size:15px;line-height:1.8;">';
        players.forEach(p => {
            resultHtml += `<span style=\"color:#09bb07;font-weight:bold;\">${p.name}</span>：<span style=\"color:#222;\">${p.word}</span><br>`;
        });
        resultHtml += '</div>';
        resultArea.innerHTML = resultHtml;
        nextRoundBtn.style.display = '';
        nextRoundBtn.innerText = '再来一局';
        nextRoundBtn.onclick = () => location.reload();
        gameOver = true;
        return;
    }
    if (alive.length <= 2) {
        resultArea.innerHTML = '卧底获胜！';
        nextRoundBtn.style.display = '';
        nextRoundBtn.innerText = '再来一局';
        nextRoundBtn.onclick = () => location.reload();
        gameOver = true;
        return;
    }
    // 继续下一轮
    nextRoundBtn.style.display = '';
    nextRoundBtn.innerText = '下一轮';
    nextRoundBtn.onclick = () => {
        players.forEach(p => { p.desc = ''; p.vote = -1; });
        resultArea.innerHTML = '';
        round++;
        startDescribe();
    };
}

fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-96c2e1584e234e01a135bfa2d41d2f0a'
    },
    body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: 'test' },
            { role: 'user', content: 'test' }
        ]
    })
}).then(res => res.json()).then(console.log).catch(console.error); 