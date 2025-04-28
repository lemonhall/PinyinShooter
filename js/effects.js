window.PinyinShooterGame = window.PinyinShooterGame || {};

PinyinShooterGame.Effects = {
    shakeIntensity: 0,
    shakeDuration: 0, // 持续时间 (毫秒)
    originalStagePosition: { x: 0, y: 0 },
    isShaking: false, // 标记是否正在震动，避免重复记录原始位置

    // 屏幕震动函数
    startShake(intensity, durationMS, app) {
        // 简单起见，新的震动会覆盖旧的
        this.shakeIntensity = intensity;
        this.shakeDuration = durationMS;
        // 记录当前舞台位置作为原始位置 (如果不在震动中)
        if (!this.isShaking) { 
            this.originalStagePosition.x = app.stage.x;
            this.originalStagePosition.y = app.stage.y;
            this.isShaking = true; // 标记开始震动
            console.log("Shake started, recorded origin:", this.originalStagePosition);
        }
    },

    // 精灵闪烁函数
    flashSprite(sprite, tintColor, durationMS) {
        if (!sprite || !sprite.parent || !sprite.visible) return; // 健壮性检查
        const originalTint = sprite.tint ?? 0xFFFFFF; // 记录原始 tint
        
        // 清除之前的闪烁定时器，防止旧的覆盖新的
        if (sprite._flashTimeoutId) {
            clearTimeout(sprite._flashTimeoutId);
        }

        sprite.tint = tintColor;

        sprite._flashTimeoutId = setTimeout(() => {
            // 仅当 sprite 仍然存在且 tint 未被再次改变时恢复
            if (sprite.parent && sprite.tint === tintColor) {
                sprite.tint = originalTint;
            }
            delete sprite._flashTimeoutId; // 清理 ID
        }, durationMS);
    },

    // 在主 Ticker 中调用此函数来更新震动效果
    updateShake(deltaMS, app) {
        const deltaFactor = deltaMS / (1000 / 60); // Normalize based on 60 FPS

        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaMS;
            if (this.shakeDuration <= 0) {
                // 震动结束 - 开始平滑恢复
                this.shakeIntensity = 0; // 停止施加新的随机偏移
                this.shakeDuration = 0; 
                this.isShaking = false; // 标记震动结束
                console.log("Shake ended, starting smooth return.");
            } else {
                // 应用震动偏移
                const shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
                const shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
                app.stage.x = this.originalStagePosition.x + shakeX;
                app.stage.y = this.originalStagePosition.y + shakeY;
            }
        } else if (app.stage.x !== this.originalStagePosition.x || app.stage.y !== this.originalStagePosition.y) {
            // 如果不在震动中，但位置未恢复，则平滑移回
            const returnSpeed = 0.2; // 恢复速度因子 (0到1之间)
            app.stage.x += (this.originalStagePosition.x - app.stage.x) * returnSpeed * deltaFactor;
            app.stage.y += (this.originalStagePosition.y - app.stage.y) * returnSpeed * deltaFactor;

            // 如果非常接近目标位置，直接设置，避免无限接近
            if (Math.abs(app.stage.x - this.originalStagePosition.x) < 0.1 && Math.abs(app.stage.y - this.originalStagePosition.y) < 0.1) {
                app.stage.x = this.originalStagePosition.x;
                app.stage.y = this.originalStagePosition.y;
                console.log("Stage returned to original position.");
            }
        }
    }
}; 