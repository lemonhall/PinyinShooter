window.PinyinShooterGame = window.PinyinShooterGame || {};

PinyinShooterGame.UI = {
    scoreText: null,
    healthText: null,
    playerSprite: null,
    playerPosition: { x: 0, y: 0 }, // 初始位置将在 init 中设置
    animatingFeedbackTexts: [],

    // 创建分数文本
    createScoreText(app) {
        this.scoreText = new PIXI.Text(`分数: 0`, {
            fontFamily: 'Arial', fontSize: 42, fill: 0x000000
        });
        this.scoreText.anchor.set(1, 0);
        this.scoreText.x = app.screen.width - 10;
        this.scoreText.y = 10;
        app.stage.addChild(this.scoreText);
        console.log("分数文本已创建");
    },

    // 创建生命值文本
    createHealthText(app, initialHealth) {
        this.healthText = new PIXI.Text(`生命值: ${initialHealth}`, {
            fontFamily: 'Arial',
            fontSize: 42,
            fill: 0x000000 // 黑色
        });
        this.healthText.x = 10; // 放在左上角
        this.healthText.y = 10;
        app.stage.addChild(this.healthText);
        console.log("生命值文本已创建");
    },

    // 创建玩家图形
    createPlayer(app) {
        const playerSvgString = '<svg width="60" height="70" viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg"><path d="M 5 15 A 25 25 0 0 1 55 15 L 55 50 L 30 65 L 5 50 Z" fill="dodgerblue" stroke="black" stroke-width="2"/></svg>';
        this.playerSprite = new PIXI.Graphics().svg(playerSvgString);
        this.playerSprite.scale.set(2.5, 2.5); // 将玩家盾牌放大到 2.5 倍
        app.stage.addChild(this.playerSprite);
        console.log("玩家 (SVG盾牌) 已创建并添加到舞台");
    },

    // 更新布局 (响应窗口大小变化)
    updateLayout(app) {
        console.log(`Updating layout for screen: ${app.screen.width}x${app.screen.height}`);
        // 更新玩家位置 (底部居中，根据按钮区域和放大的盾牌向上偏移)
        const controlsHeightEstimate = 160; // 底部按钮区域高度估算
        this.playerPosition.x = app.screen.width / 2;
        this.playerPosition.y = app.screen.height - (this.playerSprite.height * this.playerSprite.scale.y) / 2 - controlsHeightEstimate - 15; // 额外再向上移15px边距

        // 更新玩家 Sprite 位置
        if (this.playerSprite) {
            this.playerSprite.x = this.playerPosition.x - this.playerSprite.width / 2; 
            this.playerSprite.y = this.playerPosition.y - this.playerSprite.height / 2;
        }

        // 更新分数文本位置
        if (this.scoreText) {
            this.scoreText.x = app.screen.width - 10;
            this.scoreText.y = 10;
        }
         // 更新生命值文本位置 (左上角通常不需要随 resize 变化，但以防万一)
        if (this.healthText) {
            this.healthText.x = 10;
            this.healthText.y = 10;
        }
    },

    // 添加反馈文本
    addFeedbackText(text, style, app) {
        const feedbackText = new PIXI.Text(text, style);
        feedbackText.x = app.screen.width / 2 - feedbackText.width / 2; // 居中显示
        feedbackText.y = app.screen.height / 3; // 稍微靠上一点
        app.stage.addChild(feedbackText);
        
        this.animatingFeedbackTexts.push({
            text: feedbackText,
            life: 800, // 持续 800ms
            initialLife: 800,
            vy: 1.5 // 上升速度
        });
    },

    // 更新反馈文本动画 (在主 Ticker 中调用)
    updateFeedbackTexts(deltaMS, app) {
        const deltaFactor = deltaMS / (1000 / 60); // Normalize based on 60 FPS

        for (let i = this.animatingFeedbackTexts.length - 1; i >= 0; i--) {
            const feedback = this.animatingFeedbackTexts[i];
            
            // 向上移动
            feedback.text.y -= feedback.vy * deltaFactor; 
            
            // 减少生命周期
            feedback.life -= deltaMS;
            
            // 根据生命周期计算透明度 (逐渐消失)
            feedback.text.alpha = Math.max(0, feedback.life / feedback.initialLife);
            
            // 如果生命周期结束，移除
            if (feedback.life <= 0) {
                if (feedback.text.parent) {
                    app.stage.removeChild(feedback.text);
                }
                this.animatingFeedbackTexts.splice(i, 1); // 从数组中移除
            }
        }
    }
}; 