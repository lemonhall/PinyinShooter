window.PinyinShooterGame = window.PinyinShooterGame || {};

PinyinShooterGame.Audio = {
    audioCtx: null,

    // Initialize or resume AudioContext (must be called after user interaction)
    initAudio() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(e => console.error("Error resuming AudioContext:", e));
        }
        else if (!this.audioCtx) {
            try {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                console.log("AudioContext created.");
                // If created in suspended state (common before interaction), try resuming
                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume().catch(e => console.error("Error resuming initial AudioContext:", e));
                }
            } catch (e) {
                console.error("Web Audio API is not supported in this browser", e);
            }
        }
    },

    playCorrectSound() {
        if (!this.audioCtx) {
            console.warn("AudioContext not available for correct sound.");
            this.initAudio(); // Try initializing
            if (!this.audioCtx) return;
        }

        // Ensure context is running
        if (this.audioCtx.state === 'suspended') {
           this.audioCtx.resume();
        }
        
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.type = 'square'; 
        
        const freq1 = 1976; // B6
        const freq2 = 2637; // E7
        const now = this.audioCtx.currentTime;
        const switchTime = 0.05;
        const duration = 0.12;

        oscillator.frequency.setValueAtTime(freq1, now);
        oscillator.frequency.setValueAtTime(freq2, now + switchTime);

        const peakVolume = 0.35;
        gainNode.gain.setValueAtTime(peakVolume, now);
        gainNode.gain.linearRampToValueAtTime(0, now + duration); 

        oscillator.start(now);
        oscillator.stop(now + duration);
    },

    playErrorSound() {
        if (!this.audioCtx) {
            console.warn("AudioContext not available for error sound.");
            this.initAudio(); // Try initializing
            if (!this.audioCtx) return;
        }

        if (this.audioCtx.state === 'suspended') {
           this.audioCtx.resume(); 
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.type = 'square';
        
        const startFrequency = 440; // A4
        const endFrequency = 330;   // E4
        const now = this.audioCtx.currentTime;
        const pitchBendDuration = 0.1;
        oscillator.frequency.setValueAtTime(startFrequency, now);
        oscillator.frequency.linearRampToValueAtTime(endFrequency, now + pitchBendDuration);

        const peakVolume = 0.35; 
        const duration = 0.2;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(peakVolume, now + duration * 0.1);
        gainNode.gain.linearRampToValueAtTime(0, now + duration); 

        oscillator.start(now);
        oscillator.stop(now + duration);
    }
}; 