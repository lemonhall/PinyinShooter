window.PinyinShooterGame = window.PinyinShooterGame || {};

PinyinShooterGame.Speech = {
    speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // 取消之前的语音
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn("浏览器不支持语音合成 API");
        }
    }
}; 