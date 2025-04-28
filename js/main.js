window.PinyinShooterGame = window.PinyinShooterGame || {};

PinyinShooterGame.Main = {
    app: null,
    activeProjectiles: [], // Add array to store active projectiles

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
                const delta = ticker.deltaTime; // Get delta time for frame-rate independent movement

                // 更新效果 (震动)
                Effects.updateShake(deltaMS, this.app);

                // 更新UI (反馈文本动画)
                UI.updateFeedbackTexts(deltaMS, this.app);

                // 更新子弹
                this.updateProjectiles(delta, GameLogic); // Pass GameLogic to check target

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
                    const isCorrect = GameLogic.checkAnswer(tone); // 获取返回值

                    if (isCorrect && GameLogic.currentTargetSprite) {
                        // 答案正确且当前有目标，则发射子弹
                        const startX = this.app.screen.width / 2; // 从屏幕底部中心发射
                        const startY = this.app.screen.height - 60; // 稍微往上一点
                        this.createProjectile(startX, startY, GameLogic.currentTargetSprite);
                    }
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
    },

    // 新增：创建子弹函数
    createProjectile(startX, startY, targetSprite) {
        const projectile = new PIXI.Graphics();
        projectile.rect(0, 0, 10, 20); // 子弹形状：10x20 矩形
        projectile.fill(0xFFD700); // 子弹颜色：金色
        projectile.x = startX - projectile.width / 2;
        projectile.y = startY - projectile.height; // 从指定位置向上偏移一点开始

        // 存储目标引用和速度
        projectile.target = targetSprite;
        projectile.speed = 15; // 子弹速度

        this.app.stage.addChild(projectile);
        this.activeProjectiles.push(projectile);
        console.log("创建子弹，目标：", targetSprite.charData?.char);
    },

    // 新增：更新子弹函数
    updateProjectiles(delta, gameLogic) {
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = this.activeProjectiles[i];
            const target = projectile.target;

            // 检查目标是否仍然有效 (可能已被摧毁或移除)
            // GameLogic.currentTargetSprite 可能会在子弹飞行过程中变为 null
            if (!target || !target.parent || target !== gameLogic.currentTargetSprite) {
                console.log("子弹目标无效或已改变，移除子弹");
                this.app.stage.removeChild(projectile);
                projectile.destroy();
                this.activeProjectiles.splice(i, 1);
                continue;
            }

            // 计算朝向目标的方向
            const targetCenter = {
                x: target.x + target.width / 2,
                y: target.y + target.height / 2
            };
            const dx = targetCenter.x - projectile.x;
            const dy = targetCenter.y - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < projectile.speed * delta) {
                // 到达目标，或者非常接近，移除子弹
                // （不在这里处理对目标的伤害，伤害在 checkAnswer 时已处理）
                console.log("子弹到达目标，移除子弹");
                this.app.stage.removeChild(projectile);
                projectile.destroy();
                this.activeProjectiles.splice(i, 1);
            } else {
                // 向目标移动
                const angle = Math.atan2(dy, dx);
                projectile.x += Math.cos(angle) * projectile.speed * delta;
                projectile.y += Math.sin(angle) * projectile.speed * delta;

                // 如果飞出屏幕上方，也移除
                if (projectile.y < -projectile.height) {
                    console.log("子弹飞出屏幕，移除子弹");
                    this.app.stage.removeChild(projectile);
                    projectile.destroy();
                    this.activeProjectiles.splice(i, 1);
                }
            }
        }
    }
};

// 启动游戏初始化
PinyinShooterGame.Main.init(); 