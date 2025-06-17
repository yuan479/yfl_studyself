// 游戏状态
const gameState = {
    currentScript: null,
    background: '',
    characters: {},
    chatHistory: []
};

// 剧本类型
const scriptTypes = [
    { type: '悬疑', description: '充满谜团和推理的世界' },
    { type: '高武', description: '武侠与玄幻交织的世界' },
    { type: '修仙', description: '追求长生的世界' },
    { type: '异能', description: '超能力者存在的世界' },
    { type: '都市', description: '现代都市生活' },
    { type: '恋爱', description: '浪漫的爱情故事' },
    { type: '古代', description: '古代王朝的世界' }
];

// DOM 元素
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const backgroundBtn = document.getElementById('backgroundBtn');
const charactersBtn = document.getElementById('charactersBtn');
const scriptBtn = document.getElementById('scriptBtn');
const backgroundModal = document.getElementById('backgroundModal');
const charactersModal = document.getElementById('charactersModal');
const scriptModal = document.getElementById('scriptModal');
const backgroundContent = document.getElementById('backgroundContent');
const charactersContent = document.getElementById('charactersContent');
const scriptContent = document.getElementById('scriptContent');

// 初始化游戏
function initGame() {
    // 显示剧本选择
    showScriptSelection();
    
    // 绑定事件监听器
    sendBtn.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserInput();
    });
    
    // 模态框关闭按钮
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            backgroundModal.style.display = 'none';
            charactersModal.style.display = 'none';
            scriptModal.style.display = 'none';
        });
    });
    
    // 顶部按钮点击事件
    backgroundBtn.addEventListener('click', () => {
        updateBackgroundContent();
        backgroundModal.style.display = 'block';
    });
    
    charactersBtn.addEventListener('click', () => {
        updateCharactersContent();
        charactersModal.style.display = 'block';
    });
    
    scriptBtn.addEventListener('click', () => {
        showScriptSelection();
        scriptModal.style.display = 'block';
    });
}

// 显示剧本选择
function showScriptSelection() {
    scriptContent.innerHTML = scriptTypes.map(script => `
        <div class="script-option" onclick="selectScript('${script.type}')">
            <h3>${script.type}</h3>
            <p>${script.description}</p>
        </div>
    `).join('');
}

// 选择剧本
async function selectScript(type) {
    gameState.currentScript = type;
    scriptModal.style.display = 'none';
    
    // 添加加载提示
    addMessage('系统', '正在为您随机创建剧本，请稍后......', 'ai');
    
    // 调用 AI 生成初始背景
    const response = await callAI(`请为${type}类型的剧本生成一个简单的初始背景介绍，包括基本世界观和主角当前所处的环境。注意：
    1. 不要一次性介绍所有NPC
    2. 只描述当前场景和主角的处境
    3. 让NPC在后续对话中自然出现
    4. 保持故事的神秘感和探索感`);
    gameState.background = response;
    
    // 添加玩家角色设定
    const playerCharacter = await callAI(`请为${type}类型的剧本生成一个适合的主角设定，包括：
    1. 姓名
    2. 年龄
    3. 性别
    4. 性格特点
    5. 外貌特征
    6. 身份背景
    7. 人生经历
    请以JSON格式返回，格式如下：
    {
        "name": "角色名",
        "age": "年龄",
        "gender": "性别",
        "personality": "性格特点",
        "appearance": "外貌特征",
        "identity": "身份背景",
        "experience": "人生经历"
    }`);
    
    try {
        const playerInfo = JSON.parse(playerCharacter);
        gameState.characters['我'] = playerInfo;
        updateCharactersContent();
    } catch (e) {
        console.error('Failed to parse player character:', e);
    }
    
    // 添加系统消息
    addMessage('系统', `欢迎来到${type}世界！`, 'ai');
    addMessage('系统', gameState.background, 'ai');
    addMessage('系统', `你的角色设定：\n姓名：${gameState.characters['我'].name}\n身份：${gameState.characters['我'].identity}\n${gameState.characters['我'].experience}`, 'ai');
    
    // 更新背景内容
    updateBackgroundContent();
}

// 处理用户输入
async function handleUserInput() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // 添加用户消息
    addMessage('我', message, 'user');
    userInput.value = '';
    
    // 调用 AI 获取回复
    const response = await callAI(message);
    addMessage('AI', response, 'ai');
    
    // 更新游戏状态
    updateGameState(message, response);
}

// 添加消息到聊天框
function addMessage(sender, content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${content}`;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // 保存到聊天历史
    gameState.chatHistory.push({ sender, content, type });
}

// 更新游戏状态
async function updateGameState(userMessage, aiResponse) {
    // 调用 AI 分析对话，更新背景
    const analysis = await callAI(`分析以下对话，更新游戏背景：
用户: ${userMessage}
AI: ${aiResponse}
当前背景: ${gameState.background}`);

    try {
        const updates = JSON.parse(analysis);
        if (updates.background) {
            gameState.background = updates.background;
            updateBackgroundContent();
        }
    } catch (e) {
        console.error('Failed to parse AI response:', e);
    }
}

// 更新背景内容
function updateBackgroundContent() {
    backgroundContent.innerHTML = `<p>${gameState.background}</p>`;
}

// 更新角色内容
function updateCharactersContent() {
    charactersContent.innerHTML = Object.entries(gameState.characters)
        .map(([name, info]) => `
            <div class="character-info">
                <h3>${name}</h3>
                <p><strong>年龄：</strong>${info.age || '未知'}</p>
                <p><strong>性别：</strong>${info.gender || '未知'}</p>
                <p><strong>性格：</strong>${info.personality || '未知'}</p>
                <p><strong>外貌：</strong>${info.appearance || '未知'}</p>
                <p><strong>身份：</strong>${info.identity || '未知'}</p>
                <p><strong>人生经历：</strong>${info.experience || '未知'}</p>
            </div>
        `).join('');
}

// 调用 AI API
async function callAI(prompt) {
    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
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
                        content: `你是一个虚拟人生游戏的AI助手。当前剧本类型是${gameState.currentScript}。
                        你需要根据用户的输入，扮演符合当前背景的NPC角色，并推动剧情发展。
                        在对话中，你需要：
                        1. 始终以NPC的身份回复，并在回复开头标注你的角色名
                        2. 自然地展现NPC的性格特点
                        3. 在对话中适时透露一些关于NPC的信息
                        4. 每次对话后，以JSON格式返回你的角色信息，格式如下：
                        {
                            "message": "你的对话内容",
                            "character": {
                                "name": "你的角色名",
                                "age": "年龄",
                                "gender": "性别",
                                "personality": "性格特点",
                                "appearance": "外貌特征",
                                "identity": "身份背景",
                                "experience": "人生经历"
                            }
                        }
                        注意：
                        1. 回复内容要放在"message"字段中，角色信息要放在"character"字段中
                        2. 不要一次性透露太多NPC信息，让玩家通过对话逐步了解
                        3. 保持角色设定的神秘感和探索感
                        4. 根据当前背景和剧情发展，适时引入新的NPC
                        5. 在对话中不要显示JSON格式的信息，只显示对话内容`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // 尝试解析AI回复中的角色信息
        try {
            const parsedContent = JSON.parse(content);
            if (parsedContent.character) {
                // 更新角色信息
                gameState.characters[parsedContent.character.name] = parsedContent.character;
                updateCharactersContent();
                // 只返回对话内容，不显示JSON信息
                return parsedContent.message;
            }
            // 如果内容不是JSON格式，直接返回
            return content;
        } catch (e) {
            // 如果解析失败，直接返回原始内容
            return content;
        }
    } catch (error) {
        console.error('Error calling AI:', error);
        return '抱歉，我遇到了一些问题，请稍后再试。';
    }
}

// 初始化游戏
window.onload = initGame; 