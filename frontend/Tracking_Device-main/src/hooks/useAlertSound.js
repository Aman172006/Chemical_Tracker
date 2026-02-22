/**
 * useAlertSound — Web Audio API sound playback.
 * No Firebase dependency — pure browser audio.
 * Re-exports playAlertSound for components that need direct control.
 */
import { useState, useCallback, useRef } from 'react';
import { playAlertSound } from '../utils/alertSounds';

export function useAlertSound() {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const lastPlayRef = useRef(0);

    const play = useCallback((level) => {
        if (!soundEnabled) return;
        // Throttle to 2s
        if (Date.now() - lastPlayRef.current < 2000) return;
        lastPlayRef.current = Date.now();
        playAlertSound(level);
    }, [soundEnabled]);

    return {
        soundEnabled,
        setSoundEnabled,
        play,
    };
}
