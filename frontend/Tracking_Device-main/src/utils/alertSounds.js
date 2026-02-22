/**
 * CHEMTRACK — Alert Sounds (Web Audio API)
 * Three sound levels:
 *   L1 chime     — single gentle tone
 *   L2 repeating — every 10s until acknowledged
 *   L3 critical  — aggressive beep pattern (continuous)
 */

let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

/**
 * Play a single beep
 * @param {number} frequency - Hz
 * @param {number} duration  - seconds
 * @param {number} volume    - 0..1
 */
function playBeep(frequency = 800, duration = 0.15, volume = 0.3) {
    try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = frequency;
        osc.type = 'sine';
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        console.warn('Audio playback failed:', e);
    }
}

// ── LEVEL 1: SINGLE CHIME ─────────────────────────────────
export function createChime() {
    let played = false;
    return {
        play() {
            if (played) return;
            played = true;
            playBeep(660, 0.2, 0.2);
            setTimeout(() => playBeep(880, 0.3, 0.15), 220);
        },
        stop() {
            played = false;
        }
    };
}

// ── LEVEL 2: REPEATING TONE ───────────────────────────────
export function createRepeatingTone(intervalMs = 10000) {
    let timerId = null;
    let active = false;

    function playTone() {
        playBeep(700, 0.15, 0.25);
        setTimeout(() => playBeep(700, 0.15, 0.25), 200);
    }

    return {
        play() {
            if (active) return;
            active = true;
            playTone();
            timerId = setInterval(playTone, intervalMs);
        },
        stop() {
            active = false;
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
        }
    };
}

// ── LEVEL 3: CRITICAL ALARM ──────────────────────────────
// Pattern: 150ms beep (800Hz), 100ms silence, 150ms beep (800Hz), 500ms silence, REPEAT
export function createCriticalAlarm() {
    let active = false;
    let timerId = null;

    function playPattern() {
        if (!active) return;
        playBeep(800, 0.15, 0.4);
        setTimeout(() => {
            if (active) playBeep(800, 0.15, 0.4);
        }, 250); // 150ms beep + 100ms silence = 250ms offset
    }

    return {
        play() {
            if (active) return;
            active = true;
            playPattern();
            // Total pattern: 150 + 100 + 150 + 500 = 900ms
            timerId = setInterval(playPattern, 900);
        },
        stop() {
            active = false;
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
        }
    };
}

// ── CONVENIENCE: PLAY BY LEVEL ───────────────────────────
/**
 * Play the appropriate alert sound for a given threat level.
 * @param {number} level - 1 (chime), 2 (double-tone), 3 (alarm)
 */
export function playAlertSound(level) {
    try {
        if (level >= 3) {
            const alarm = createCriticalAlarm();
            alarm.play();
            setTimeout(() => alarm.stop(), 3000);
        } else if (level === 2) {
            const tone = createRepeatingTone();
            tone.play();
            setTimeout(() => tone.stop(), 1500);
        } else {
            const chime = createChime();
            chime.play();
        }
    } catch (e) {
        console.warn('Alert sound playback failed:', e);
    }
}

