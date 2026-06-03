"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

interface AudioContextType {
    isPlaying: boolean;
    isMuted: boolean;
    volume: number;
    togglePlay: () => void;
    toggleMute: () => void;
    changeVolume: (val: number) => void;
    playChime: () => void;
    playLevelUp: () => void;
    setMusicMood: (mood: "HAPPY" | "NORMAL" | "TIRED" | "OVERWHELMED") => void;
}

const AudioContextInstance = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
    const context = useContext(AudioContextInstance);
    if (!context) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(0.2); // 20% default volume
    const [mood, setMood] = useState<"HAPPY" | "NORMAL" | "TIRED" | "OVERWHELMED">("NORMAL");

    const audioCtxRef = useRef<AudioContext | null>(null);
    const masterGainRef = useRef<GainNode | null>(null);
    const schedulerRef = useRef<NodeJS.Timeout | null>(null);
    const chordIndexRef = useRef(0);

    // Initialize Web Audio Context on first interaction
    const initAudio = () => {
        if (audioCtxRef.current) return;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        const masterGain = ctx.createGain();
        masterGain.gain.value = isMuted ? 0 : volume;
        masterGain.connect(ctx.destination);

        audioCtxRef.current = ctx;
        masterGainRef.current = masterGain;
    };

    // Synthesize a cozy soft bell/chime note
    const playBellNode = (frequency: number, startTime: number, duration: number, type: OscillatorType = "sine") => {
        const ctx = audioCtxRef.current;
        const masterGain = masterGainRef.current;
        if (!ctx || !masterGain || isMuted) return;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        // Envelope: cute chime bell curves
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05); // quick attack
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // smooth decay

        osc.connect(gainNode);
        gainNode.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
    };

    // Synthesize a soothing ambient synth pad chord
    const playPadChord = (frequencies: number[], startTime: number, duration: number) => {
        const ctx = audioCtxRef.current;
        const masterGain = masterGainRef.current;
        if (!ctx || !masterGain || isMuted) return;

        frequencies.forEach((freq) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = "triangle";
            osc.frequency.value = freq;

            // Slow breath pad envelope: slow attack, slow decay
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.08, startTime + 1.5); // long attack
            gainNode.gain.linearRampToValueAtTime(0.08, startTime + duration - 1.5); // hold
            gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration); // slow release

            // Adding a tiny detune for chorus warmth
            osc.detune.value = (Math.random() - 0.5) * 12;

            osc.connect(gainNode);
            gainNode.connect(masterGain);

            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    };

    // Ambient background loop scheduler
    const scheduleNextMeasure = () => {
        const ctx = audioCtxRef.current;
        if (!ctx || ctx.state === "suspended" || !isPlaying) return;

        const now = ctx.currentTime;
        const measureDuration = 6.0; // 6 seconds per chord breathing loop

        // Progression charts based on mood
        // Happy: Cmaj7 (C-E-G-B), Am7 (A-C-E-G), Fmaj7 (F-A-C-E), G6 (G-B-D-E)
        const happyChords = [
            [261.63, 329.63, 392.00, 493.88], // C4, E4, G4, B4
            [220.00, 261.63, 329.63, 392.00], // A3, C4, E4, G4
            [174.61, 220.00, 261.63, 329.63], // F3, A3, C4, E4
            [196.00, 246.94, 293.66, 329.63]  // G3, B3, D4, E4
        ];

        // Comforting / Overwhelmed: Cmaj7 (C-E-G-B), Em7 (E-G-B-D), Fmaj7 (F-A-C-E), Fm (F-Ab-C)
        const calmingChords = [
            [130.81, 164.81, 196.00, 246.94], // C3, E3, G3, B3 (low and warm)
            [164.81, 196.00, 246.94, 293.66], // E3, G3, B3, D4
            [174.61, 220.00, 261.63, 329.63], // F3, A3, C4, E4
            [174.61, 207.65, 261.63, 311.13]  // F3, Ab3, C4, Eb4 (very cozy and soft minor/major shift)
        ];

        const activeChords = (mood === "HAPPY" || mood === "NORMAL") ? happyChords : calmingChords;
        const currentChord = activeChords[chordIndexRef.current % activeChords.length];

        // Play the base warm pad chord
        playPadChord(currentChord, now, measureDuration);

        // Periodically tick a light magical star bell chime on top (only for happy/normal state)
        if (mood === "HAPPY" || mood === "NORMAL") {
            const bellMelody = currentChord[Math.floor(Math.random() * currentChord.length)] * 2;
            playBellNode(bellMelody, now + 1.5, 2.0);
            if (Math.random() > 0.5) {
                const secondBell = currentChord[Math.floor(Math.random() * currentChord.length)] * 2.5;
                playBellNode(secondBell, now + 3.0, 1.5);
            }
        } else {
            // Calm breathing: gently add a single extremely soft bell in a lower, comforting octave
            const warmBell = currentChord[0] * 2;
            playBellNode(warmBell, now + 2.0, 3.0, "sine");
        }

        chordIndexRef.current++;
        schedulerRef.current = setTimeout(scheduleNextMeasure, measureDuration * 1000 - 50); // slight buffer
    };

    // React to changes in play state
    useEffect(() => {
        if (isPlaying) {
            initAudio();
            if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
                audioCtxRef.current.resume();
            }
            chordIndexRef.current = 0;
            scheduleNextMeasure();
        } else {
            if (schedulerRef.current) {
                clearTimeout(schedulerRef.current);
                schedulerRef.current = null;
            }
        }

        return () => {
            if (schedulerRef.current) {
                clearTimeout(schedulerRef.current);
            }
        };
    }, [isPlaying, mood]);

    // Handle master volume or mute adjustments
    useEffect(() => {
        if (masterGainRef.current) {
            masterGainRef.current.gain.setValueAtTime(isMuted ? 0 : volume, audioCtxRef.current?.currentTime || 0);
        }
    }, [volume, isMuted]);

    const togglePlay = () => {
        initAudio();
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        initAudio();
        setIsMuted(!isMuted);
    };

    const changeVolume = (val: number) => {
        initAudio();
        setVolume(val);
    };

    // Public SFX: Sparkling reward chime arpeggio
    const playChime = () => {
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();

        const now = ctx.currentTime;
        // Ascending pentatonic star shine: C5, D5, E5, G5, A5, C6
        const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        
        freqs.forEach((freq, idx) => {
            playBellNode(freq, now + idx * 0.07, 1.2, "triangle");
        });
    };

    // Public SFX: Uplifting level up fanfare
    const playLevelUp = () => {
        initAudio();
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === "suspended") ctx.resume();

        const now = ctx.currentTime;
        // Rising power chimes: C4, G4, C5, E5, G5, C6 (major arpeggio cascade!)
        const freqs = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];

        freqs.forEach((freq, idx) => {
            playBellNode(freq, now + idx * 0.09, 2.0, "sine");
            // add a double sub-harmonics layer to make it sound richer/fuller!
            if (idx > 1 && idx < 6) {
                playBellNode(freq / 2, now + idx * 0.09, 1.5, "triangle");
            }
        });
    };

    const setMusicMood = (newMood: "HAPPY" | "NORMAL" | "TIRED" | "OVERWHELMED") => {
        setMood(newMood);
    };

    return (
        <AudioContextInstance.Provider
            value={{
                isPlaying,
                isMuted,
                volume,
                togglePlay,
                toggleMute,
                changeVolume,
                playChime,
                playLevelUp,
                setMusicMood
            }}
        >
            {children}

            {/* Float audio controller badge */}
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border-2 border-amber-200 bg-white/80 p-2 shadow-lg backdrop-blur-md transition-all hover:scale-105">
                <button
                    onClick={togglePlay}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-white font-bold shadow-md transition hover:bg-amber-500"
                    title={isPlaying ? "Pause background track" : "Play soft background music"}
                >
                    {isPlaying ? "⏸" : "🎵"}
                </button>
                {isPlaying && (
                    <>
                        <button
                            onClick={toggleMute}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold transition hover:bg-amber-300"
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? "🔇" : "🔊"}
                        </button>
                        <input
                            type="range"
                            min="0"
                            max="0.5"
                            step="0.05"
                            value={volume}
                            onChange={(e) => changeVolume(parseFloat(e.target.value))}
                            className="w-16 h-1 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            title="Volume level"
                        />
                    </>
                )}
            </div>
        </AudioContextInstance.Provider>
    );
};
