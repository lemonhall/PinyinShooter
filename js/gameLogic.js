window.PinyinShooterGame = window.PinyinShooterGame || {};

PinyinShooterGame.GameLogic = {
    // 依赖项 (将在 init 中设置)
    app: null,
    UI: null,
    Audio: null,
    Effects: null,
    Data: null,
    Speech: null,

    // 游戏状态
    playerScore: 0,
    playerHealth: 100,
    initialPlayerHealth: 100,
    isGameOver: false,
    currentTarget: null,
    targetHealth: 0,
    currentTargetSprite: null,
    currentTargetTickerCallback: null,
    nextTargetTimeoutId: null,
    attackPower: 15,
    targetInitialHealth: 30,

    init(app, ui, audio, effects, data, speech) {
        this.app = app;
        this.UI = ui;
        this.Audio = audio;
        this.Effects = effects;
        this.Data = data;
        this.Speech = speech;
        this.playerHealth = this.initialPlayerHealth; // 重置健康
        this.playerScore = 0; // 重置分数
        this.isGameOver = false;
    },

    // 创建飞来的目标 (组合形式：敌人 + 头顶文字)
    createFlyingTarget() {
        if (this.isGameOver) return; // 游戏结束则不创建
        // 防御性检查：如果当前已有目标，则不创建新的
        if (this.currentTarget) {
            console.warn("尝试创建新目标，但当前目标已存在，已阻止。");
            return; 
        }

        const targetCharIndex = Math.floor(Math.random() * this.Data.characters.length);
        const targetChar = this.Data.characters[targetCharIndex];

        if (!targetChar) {
          console.error("无法获取目标汉字数据!");
          this.scheduleNextTarget(1000); // 稍后重试
          return;
        }

        console.log("创建新目标组合:", targetChar.char);
        this.currentTarget = targetChar;
        this.targetHealth = this.targetInitialHealth; // 重置目标生命值
        
        // 创建 Container
        const targetContainer = new PIXI.Container();
        targetContainer.charData = this.currentTarget; // 将数据关联到 Container
        targetContainer.isEnemy = true; // 添加标记，方便识别
        targetContainer.uniqueId = Date.now() + Math.random(); // 添加唯一ID，用于调试
        console.log(`[${targetContainer.uniqueId}] 创建Container`);

        // 1. 创建敌人 Emoji 文本
        const enemyEmojiText = new PIXI.Text(this.currentTarget.emoji, { 
            fontFamily: 'Arial', 
            fontSize: 100 
        });
        enemyEmojiText.name = 'emojiText';
        enemyEmojiText.x = 0;
        enemyEmojiText.y = 0;
        enemyEmojiText.anchor.set(0.5, 0.5);
        targetContainer.addChild(enemyEmojiText);

        // 2. 创建汉字文本
        const charText = new PIXI.Text(this.currentTarget.char, { 
            fontFamily: 'Arial', 
            fontSize: 56,
            fill: 0x000000, align: 'center' 
        });
        charText.name = 'hanziText';
        charText.anchor.set(0.5, 1);
        charText.x = enemyEmojiText.x;
        charText.y = enemyEmojiText.y - enemyEmojiText.height / 2 - 5;
        targetContainer.addChild(charText);

        const containerBounds = targetContainer.getLocalBounds();
        targetContainer.x = Math.random() * (this.app.screen.width - containerBounds.width);
        targetContainer.y = -containerBounds.height; // 从屏幕顶部外开始

        this.currentTargetSprite = targetContainer; 
        this.app.stage.addChild(targetContainer);
        console.log(`目标组合 '${this.currentTarget.char}' 已添加到舞台...`);

        this.Speech.speak(this.currentTarget.char);

        // 移动 Container 的逻辑
        const move = (ticker) => { 
            if (!targetContainer.parent) {
                console.warn(`[${targetContainer.uniqueId}] - Move func executed but container not on stage. Removing ticker.`);
                this.app.ticker.remove(move);
                this.currentTargetTickerCallback = null; // 清理引用
                return; 
            }

            const delta = ticker.deltaTime;
            const speed = 1.5;
            const playerPosition = this.UI.playerPosition;
            const playerSprite = this.UI.playerSprite;

            // 计算朝向玩家的方向向量
            const dx = playerPosition.x - (targetContainer.x + containerBounds.width / 2);
            const dy = playerPosition.y - (targetContainer.y + containerBounds.height / 2);
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length > 1) { 
                const normalizedDx = dx / length;
                const normalizedDy = dy / length;
                targetContainer.x += normalizedDx * speed * delta;
                targetContainer.y += normalizedDy * speed * delta;
            }

            // 碰撞检测
            const enemyBoundsRect = targetContainer.getBounds().rectangle; 
            const playerBoundsRect = playerSprite.getBounds().rectangle; 

            if (enemyBoundsRect && playerBoundsRect && enemyBoundsRect.intersects(playerBoundsRect)) {
                this.handlePlayerCollision(targetContainer, move);
            }
            // 移出屏幕底部
            else if (targetContainer.y > this.app.screen.height + 20) {
                this.handleTargetMissed(targetContainer, move);
            }
        };
        this.currentTargetTickerCallback = move;
        this.app.ticker.add(move);
    },

    handlePlayerCollision(targetContainer, moveCallback) {
        const targetId = targetContainer.uniqueId;
        const targetData = targetContainer.charData; // 使用关联的数据

        if (!targetData) {
             console.error(`[${targetId}] - Collision but no charData found!`);
             this.app.ticker.remove(moveCallback);
             this.removeTargetFromStage(targetContainer, `Collision-NoData`);
             this.clearCurrentTargetState();
             this.scheduleNextTarget(500);
             return;
        }

        console.log(`[${targetId}] - 碰撞玩家 - ${targetData.char} 击中!`);
        this.Effects.startShake(10, 250, this.app);
        this.Effects.flashSprite(this.UI.playerSprite, 0xFF0000, 200);

        this.playerHealth -= 10;
        this.UI.healthText.text = `生命值: ${this.playerHealth}`;
        console.log(`玩家生命值剩余: ${this.playerHealth}`);

        // 移除敌人和 ticker
        this.app.ticker.remove(moveCallback);
        this.removeTargetFromStage(targetContainer, `Collision-Player`);
        this.clearCurrentTargetState();

        if (this.playerHealth <= 0 && !this.isGameOver) {
            this.gameOver();
        } else if (!this.isGameOver) {
            console.log(`玩家被 ${targetData.char} 击中，准备生成下一个`);
            this.scheduleNextTarget(500);
        }
    },

    handleTargetMissed(targetContainer, moveCallback) {
        const targetId = targetContainer.uniqueId;
        const missedTargetData = targetContainer.charData; // 使用关联的数据

        console.log(`[${targetId}] - 飞出屏幕 - 准备移除`);
        this.app.ticker.remove(moveCallback);
        this.removeTargetFromStage(targetContainer, `Missed`);

        console.log(`目标 ${missedTargetData?.char || '未知目标'} 移出屏幕，准备生成下一个`);
        this.clearCurrentTargetState();
        this.scheduleNextTarget(800); // Missed target, maybe slightly longer delay
    },

    // 检查答案
    checkAnswer(selectedTone) {
        if (this.isGameOver || !this.currentTarget) {
            console.log("当前没有目标或游戏已结束，无法检查答案");
            return;
        }

        console.log(`检查答案: 目标 '${this.currentTarget.char}'(tone ${this.currentTarget.tone}), 选择 tone ${selectedTone}`);

        if (selectedTone === this.currentTarget.tone) {
            this.targetHealth -= this.attackPower;
            console.log(`声调正确! 目标 '${this.currentTarget.char}' 生命值剩余: ${this.targetHealth}`);
            this.Audio.playCorrectSound();

            if (this.targetHealth <= 0) {
                this.handleTargetDestroyed();
            } else {
                // 普通命中效果
                this.Effects.startShake(4, 150, this.app);
                if (this.currentTargetSprite) {
                   this.Effects.flashSprite(this.currentTargetSprite, 0xFFFFFF, 100);
                }
                this.UI.addFeedbackText('✓ 正确!', {
                    fontFamily: 'Arial', fontSize: 50, fill: 0x00FF00,
                    stroke: '#006400', strokeThickness: 3
                }, this.app);
            }
        } else { // 声调错误
            console.log(`声调错误! 目标 '${this.currentTarget.char}' 需要 tone ${this.currentTarget.tone}, 选择了 tone ${selectedTone}`);
            this.Audio.playErrorSound();
            this.Effects.startShake(6, 150, this.app);
            this.Effects.flashSprite(this.UI.playerSprite, 0xFF0000, 150); // 玩家闪红
            this.UI.addFeedbackText('✗ 声调错误!', {
                fontFamily: 'Arial', fontSize: 50, fill: 0xFF0000,
                stroke: '#8B0000', strokeThickness: 3
            }, this.app);
        }
    },

    handleTargetDestroyed() {
        console.log(`目标组合 '${this.currentTarget.char}' 已击毁!`);
        this.Effects.startShake(6, 150, this.app);

        if (this.currentTargetTickerCallback) {
            this.app.ticker.remove(this.currentTargetTickerCallback);
            this.currentTargetTickerCallback = null; // 清理 ticker 引用
        }

        const destroyedContainer = this.currentTargetSprite;
        const finalTargetData = this.currentTarget; // 保存数据

        // 清理当前目标状态 (在这里清理，后续逻辑需要 finalTargetData)
        this.currentTarget = null;
        this.currentTargetSprite = null;
        // currentTargetTickerCallback 已在上面清理

        // 更新分数
        this.playerScore += 10; // 假设每个目标 10 分
        this.UI.scoreText.text = `分数: ${this.playerScore}`;

        if (destroyedContainer && destroyedContainer.parent) { // 确保还在舞台上
            const hanziText = destroyedContainer.getChildByName('hanziText');
            const emojiText = destroyedContainer.getChildByName('emojiText');

            if (hanziText) {
                hanziText.visible = false;
            }

            // 显示拼音
            const pinyinText = new PIXI.Text(finalTargetData.pinyin, {
                fontFamily: 'Arial', fontSize: 56, fill: 0x000000, align: 'center'
            });
            pinyinText.name = 'pinyinText';
            pinyinText.anchor.set(0.5, 1);
            if (emojiText) {
                pinyinText.x = emojiText.x;
                pinyinText.y = emojiText.y - emojiText.height / 2 - 5;
            } else {
                pinyinText.x = destroyedContainer.width / 2;
                pinyinText.y = 0;
            }
            destroyedContainer.addChild(pinyinText);

            this.Speech.speak(finalTargetData.char); // 朗读击毁的字

            // 延迟移除击毁的 container
            const destroyDelay = 1500;
            console.log(`Scheduling removal of destroyed target [${destroyedContainer.uniqueId}] in ${destroyDelay}ms`);
            setTimeout(() => {
                this.removeTargetFromStage(destroyedContainer, `Destroyed-Delayed`);
                // 在延迟移除后，安排创建下一个目标
                if (!this.isGameOver) {
                     this.scheduleNextTarget(200); // Short delay after removal
                }
            }, destroyDelay);

        } else {
            console.error("击毁时无法找到目标 Container 或已不在舞台!", destroyedContainer);
            // 即使找不到 sprite，也应安排下一个目标
             if (!this.isGameOver) {
                this.scheduleNextTarget(500);
            }
        }
    },

    // 安全地从舞台移除目标
    removeTargetFromStage(targetContainer, reason) {
        if (targetContainer && targetContainer.parent) {
             const targetId = targetContainer.uniqueId || 'UnknownID';
             console.log(`[${targetId}] - Removing target from stage. Reason: ${reason}`);
             this.app.stage.removeChild(targetContainer);
        } else {
             const targetId = targetContainer ? targetContainer.uniqueId : 'NullContainer';
             console.warn(`[${targetId}] - Attempted to remove target, but it was not on stage or null. Reason: ${reason}`);
        }
    },
    
    // 清理当前目标状态变量
    clearCurrentTargetState() {
         this.currentTarget = null;
         this.currentTargetSprite = null;
         if (this.currentTargetTickerCallback) {
             this.app.ticker.remove(this.currentTargetTickerCallback);
             this.currentTargetTickerCallback = null;
         }
    },

    // 安排下一个目标的创建
    scheduleNextTarget(delay) {
        if (this.isGameOver) return; // 防止游戏结束后还调度
        clearTimeout(this.nextTargetTimeoutId); // 清除之前的 timeout
        console.log(`Scheduling next target creation in ${delay}ms`);
        this.nextTargetTimeoutId = setTimeout(() => {
            this.nextTargetTimeoutId = null; // 清理 timeout ID 引用
            // 再次检查状态，确保在延迟期间游戏没有结束
            if (!this.currentTarget && !this.isGameOver) { 
                this.createFlyingTarget();
            }
        }, delay);
    },

    // 游戏结束处理
    gameOver() {
        if (this.isGameOver) return; // 防止重复执行
        console.log("游戏结束!");
        this.isGameOver = true;
        this.clearCurrentTargetState(); // 清理场上可能的目标
        clearTimeout(this.nextTargetTimeoutId); // 取消计划中的目标创建
        this.nextTargetTimeoutId = null;
        this.app.ticker.stop(); // 停止游戏循环
        document.getElementById('game-over-overlay').style.display = 'flex';
        // 可以考虑在这里播放游戏结束音效
    },

    // 重新开始游戏
    restartGame() {
        console.log("重新开始游戏...");
        clearTimeout(this.nextTargetTimeoutId);
        this.nextTargetTimeoutId = null;

        this.app.ticker.stop(); // 先停止 ticker

        // 清理舞台上的敌人对象 (直接移除所有 isEnemy 对象)
        console.log("Restart: 开始清理舞台上的敌人...");
        for (let i = this.app.stage.children.length - 1; i >= 0; i--) {
            const child = this.app.stage.children[i];
            if (child.isEnemy) { // 检查标记
                this.removeTargetFromStage(child, "Restart");
            }
        }
        // 清理残留的反馈文字
        this.UI.animatingFeedbackTexts.forEach(fb => {
            if (fb.text.parent) this.app.stage.removeChild(fb.text);
        });
        this.UI.animatingFeedbackTexts = [];

        console.log("Restart: 清理完毕。");

        // 重置状态变量
        this.playerHealth = this.initialPlayerHealth;
        this.playerScore = 0;
        this.isGameOver = false;
        this.clearCurrentTargetState(); // 再次确保清理干净
        this.Effects.shakeDuration = 0; // 停止震动
        this.app.stage.x = this.Effects.originalStagePosition.x;
        this.app.stage.y = this.Effects.originalStagePosition.y;

        // 更新 UI
        this.UI.healthText.text = `生命值: ${this.playerHealth}`;
        this.UI.scoreText.text = `分数: ${this.playerScore}`;
        document.getElementById('game-over-overlay').style.display = 'none';

        this.app.ticker.start(); // 重新启动 Ticker
        this.scheduleNextTarget(500); // 延迟一点开始第一个目标
    }
}; 