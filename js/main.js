window.PinyinShooterGame = window.PinyinShooterGame || {};

PinyinShooterGame.Main = {
    app: null,

    init() {
        // 等待DOM加载完成
        document.addEventListener('DOMContentLoaded', async () => {
            // 引用其他模块
            const UI = PinyinShooterGame.UI;
            const Audio = PinyinShooterGame.Audio;
            const Effects = PinyinShooterGame.Effects;
            const GameLogic = PinyinShooterGame.GameLogic;
            const Data = PinyinShooterGame.Data;
            const Speech = PinyinShooterGame.Speech;

            // 初始化游戏
            this.app = new PIXI.Application();
            await this.app.init({
                backgroundColor: 0xE8F4FF,
                resizeTo: window
            });

            // 确保正确插入canvas
            const container = document.getElementById('game-container');
            container.insertBefore(this.app.view, container.firstChild);

            // 初始化游戏逻辑模块 (传入依赖)
            GameLogic.init(this.app, UI, Audio, Effects, Data, Speech);

            // 创建 UI 元素
            UI.createScoreText(this.app);
            UI.createHealthText(this.app, GameLogic.initialPlayerHealth);
            UI.createPlayer(this.app);
            
            // 初始布局
            UI.updateLayout(this.app);

            // 添加主 Ticker 循环
            this.app.ticker.add((ticker) => {
                const deltaMS = ticker.deltaMS;
                
                // 更新效果 (震动)
                Effects.updateShake(deltaMS, this.app);

                // 更新UI (反馈文本动画)
                UI.updateFeedbackTexts(deltaMS, this.app);

                // 注意: 目标的移动逻辑现在在 GameLogic.createFlyingTarget 内的 ticker 中处理
            });

             // 添加 resize 事件监听
            window.addEventListener('resize', () => {
                this.app.resize(); // 触发 PixiJS 内部 resize
                UI.updateLayout(this.app); // 更新我们自己的布局
            });

            // 绑定音调按钮
            document.querySelectorAll('.tone-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    // 点击时尝试初始化/恢复 AudioContext (如果需要)
                    Audio.initAudio(); 

                    const tone = parseInt(btn.dataset.tone);
                    GameLogic.checkAnswer(tone); // 调用游戏逻辑检查答案
                });
            });

            // 绑定重新开始按钮
            const restartBtn = document.getElementById('restart-btn');
            restartBtn.addEventListener('click', () => {
                 GameLogic.restartGame(); // 调用游戏逻辑重启游戏
            });

            // 开始游戏 - 创建第一个目标
             GameLogic.scheduleNextTarget(500); // 延迟一点启动

            console.log("游戏初始化完成。");
        });
    }
};

// 启动游戏初始化
PinyinShooterGame.Main.init(); 