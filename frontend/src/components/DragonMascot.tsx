"use client";

import React, { useEffect, useState } from "react";

interface DragonMascotProps {
    stars: number;
    state?: "idle" | "celebrate" | "sleep" | "fly";
    avatarColor?: "ruby" | "emerald" | "sapphire" | string;
}

export const DragonMascot: React.FC<DragonMascotProps> = ({
    stars,
    state = "idle",
    avatarColor = "ruby"
}) => {
    const [animationState, setAnimationState] = useState(state);
    const [prevStars, setPrevStars] = useState(stars);
    const [starTrigger, setStarTrigger] = useState(false);

    useEffect(() => {
        setAnimationState(state);
        // If celebrate, auto-return to idle after 1.5 seconds
        if (state === "celebrate") {
            const timer = setTimeout(() => {
                setAnimationState("idle");
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [state]);

    useEffect(() => {
        if (stars > prevStars) {
            setStarTrigger(true);
            const timer = setTimeout(() => {
                setStarTrigger(false);
            }, 1800);
            setPrevStars(stars);
            return () => clearTimeout(timer);
        } else {
            setPrevStars(stars);
        }
    }, [stars, prevStars]);

    // Star boundaries:
    // 0-5: Egg
    // 6-15: Baby
    // 16-35: Young
    // 36-60: Hero
    // 61+: King
    const getStage = (): { level: string; label: string; imgSrc: string; isVideo?: boolean } => {
        if (stars <= 5) return { level: "EGG", label: "Dragon Egg", imgSrc: "/images/emerald_egg.png", isVideo: false };
        if (stars <= 15) return { level: "BABY", label: "Baby Dragon", imgSrc: "/images/emerald_baby.mp4", isVideo: true };
        if (stars <= 35) return { level: "YOUNG", label: "Young Dragon", imgSrc: "/images/emerald_young.mp4", isVideo: true };
        if (stars <= 60) return { level: "HERO", label: "Hero Dragon", imgSrc: "/images/emerald_hero.mp4", isVideo: true };
        return { level: "KING", label: "King Dragon", imgSrc: "/images/emerald_king.png", isVideo: false };
    };

    const stage = getStage();

    // Map color themes (Ruby, Emerald, Sapphire) to high-quality CSS hue-rotate filters
    const getColorFilter = () => {
        switch (avatarColor.toLowerCase()) {
            case "ruby":
                return "hue-rotate(-120deg) saturate(1.4) contrast(1.05)";
            case "sapphire":
                return "hue-rotate(130deg) saturate(1.3) contrast(1.05)";
            case "emerald":
            default:
                return "none";
        }
    };

    const colorFilter = getColorFilter();

    // Helper to get animation CSS class
    const getAnimationClass = () => {
        const isEgg = stage.level === "EGG";

        if (isEgg) {
            if (starTrigger || animationState === "celebrate" || animationState === "fly") {
                return "animate-egg-wobble";
            }
            return "animate-egg-idle";
        }

        if (starTrigger) return "animate-dragon-star-gain";
        if (animationState === "sleep") return "animate-dragon-sleep";
        if (animationState === "celebrate") return "animate-dragon-celebrate";
        if (animationState === "fly") return "animate-dragon-fly";
        return "animate-dragon-idle";
    };

    return (
        <div className="relative flex flex-col items-center justify-center p-4">
            {/* Embedded styles for cute keyframe animations */}
            <style>{`
                @keyframes egg-idle {
                    0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
                    50% { transform: translateY(-5px) scale(1.01) rotate(0.5deg); }
                }
                @keyframes egg-wobble {
                    0%, 100% { transform: rotate(0deg) scale(1); }
                    15% { transform: rotate(-8deg) scale(0.96, 1.04); }
                    30% { transform: rotate(8deg) scale(1.04, 0.96); }
                    45% { transform: rotate(-6deg) scale(0.98, 1.02); }
                    60% { transform: rotate(6deg) scale(1.02, 0.98); }
                    75% { transform: rotate(-3deg) scale(0.99, 1.01); }
                    90% { transform: rotate(3deg) scale(1.01, 0.99); }
                }
                @keyframes dragon-idle {
                    0%, 100% { transform: translate(0px, 0px) scale(1) rotate(0deg) scaleX(1); }
                    25% { transform: translate(-15px, -6px) scale(1.01) rotate(-1.5deg) scaleX(1); }
                    48% { transform: translate(-5px, -3px) scale(1.02) rotate(1deg) scaleX(1); }
                    50% { transform: translate(-5px, -3px) scale(1.02) rotate(1deg) scaleX(-1); }
                    75% { transform: translate(15px, -8px) scale(1.01) rotate(1.5deg) scaleX(-1); }
                    98% { transform: translate(5px, 0px) scale(1) rotate(-0.5deg) scaleX(-1); }
                }
                @keyframes dragon-sleep {
                    0%, 100% { transform: translate(0px, 0px) rotate(1.5deg) scale(0.95) scaleX(1); opacity: 0.95; }
                    25% { transform: translate(-8px, 3px) rotate(-1deg) scale(0.92) scaleX(1); opacity: 0.8; }
                    48% { transform: translate(-4px, 1px) rotate(1deg) scale(0.94) scaleX(1); opacity: 0.9; }
                    50% { transform: translate(-4px, 1px) rotate(1deg) scale(0.94) scaleX(-1); opacity: 0.9; }
                    75% { transform: translate(8px, 4px) rotate(-1.5deg) scale(0.91) scaleX(-1); opacity: 0.8; }
                    98% { transform: translate(2px, 0px) rotate(0.5deg) scale(0.95) scaleX(-1); opacity: 0.95; }
                }
                @keyframes dragon-celebrate {
                    0% { transform: scale(1) translate(0, 0) rotate(0deg) scaleX(1); }
                    15% { transform: scale(0.85, 1.15) translate(0, -35px) rotate(-10deg) scaleX(1); }
                    30% { transform: scale(1.15, 0.85) translate(-20px, 15px) rotate(15deg) scaleX(-1); }
                    45% { transform: scale(0.9, 1.1) translate(20px, -25px) rotate(-15deg) scaleX(1); }
                    60% { transform: scale(1.1) translate(0, -40px) rotate(360deg) scaleX(1); }
                    75% { transform: scale(1.05, 0.95) translate(0, 0) rotate(-5deg) scaleX(-1); }
                    90% { transform: scale(0.95, 1.05) translate(0, -5px) rotate(5deg) scaleX(1); }
                    100% { transform: scale(1) translate(0, 0) rotate(0deg) scaleX(1); }
                }
                @keyframes dragon-fly {
                    0%, 100% { transform: translate(0px, -12px) rotate(0deg) scaleX(1); }
                    25% { transform: translate(-30px, -25px) rotate(-8deg) scaleX(1); }
                    48% { transform: translate(-10px, 10px) rotate(12deg) scaleX(1); }
                    50% { transform: translate(-10px, 10px) rotate(12deg) scaleX(-1); }
                    75% { transform: translate(30px, -20px) rotate(-8deg) scaleX(-1); }
                    98% { transform: translate(10px, -5px) rotate(0deg) scaleX(-1); }
                }
                @keyframes dragon-star-gain {
                    0% { transform: scale(1) translate(0, 0) rotate(0deg) scaleX(1); }
                    15% { transform: scale(1.15, 0.85) translate(0, 15px) rotate(0deg) scaleX(1); }
                    30% { transform: scale(0.9, 1.2) translate(-45px, -50px) rotate(-20deg) scaleX(1); }
                    45% { transform: scale(1) translate(45px, -30px) rotate(20deg) scaleX(-1); }
                    60% { transform: scale(1.1) translate(0, -60px) rotate(360deg) scaleX(1); }
                    75% { transform: scale(0.95, 1.05) translate(0, -10px) rotate(0deg) scaleX(1); }
                    90% { transform: scale(1.05, 0.95) translate(0, 5px) rotate(0deg) scaleX(1); }
                    100% { transform: scale(1) translate(0, 0) rotate(0deg) scaleX(1); }
                }
                @keyframes sparkle-glow {
                    0%, 100% { opacity: 0.3; transform: scale(0.9); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
                .animate-egg-idle { animation: egg-idle 3s ease-in-out infinite; }
                .animate-egg-wobble { animation: egg-wobble 1.5s cubic-bezier(0.25, 1, 0.5, 1); }
                .animate-dragon-idle { animation: dragon-idle 3.5s ease-in-out infinite; }
                .animate-dragon-sleep { animation: dragon-sleep 4s ease-in-out infinite; }
                .animate-dragon-celebrate { animation: dragon-celebrate 1.5s cubic-bezier(0.25, 1, 0.5, 1); }
                .animate-dragon-fly { animation: dragon-fly 2s ease-in-out infinite; }
                .animate-dragon-star-gain { animation: dragon-star-gain 1.8s cubic-bezier(0.25, 1, 0.5, 1); }
                .animate-sparkle { animation: sparkle-glow 2s ease-in-out infinite; }
            `}</style>

            {/* Cloud and Sky Whimsical Background Layer */}
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-full bg-gradient-to-b from-sky-100/70 to-indigo-50/50 blur-xl"></div>

            <div className="relative flex items-center justify-center w-52 h-52">
                {stage.isVideo ? (
                    <video
                        key={stage.level}
                        src={stage.imgSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`w-48 h-48 object-cover rounded-3xl drop-shadow-xl select-none transition-all duration-300 ${getAnimationClass()}`}
                        style={{ filter: colorFilter }}
                    />
                ) : (
                    <img
                        src={stage.imgSrc}
                        alt={stage.label}
                        className={`w-48 h-48 object-contain drop-shadow-xl select-none transition-all duration-300 ${getAnimationClass()}`}
                        style={{ filter: colorFilter }}
                    />
                )}
            </div>

            {/* Displaying Sleep Bubbles or Star particles */}
            {animationState === "sleep" && (
                <div className="absolute top-8 right-12 flex flex-col items-center select-none font-bold text-amber-500 opacity-80">
                    <span className="animate-bounce delay-100 text-xs">z</span>
                    <span className="animate-bounce delay-300 text-sm">Z</span>
                    <span className="animate-bounce delay-500 text-lg">Z</span>
                </div>
            )}

            {/* Displaying Growth Label and Level status */}
            <div className="mt-4 flex flex-col items-center">
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-1 text-xs font-black uppercase tracking-widest text-white shadow-md">
                    {stage.label}
                </span>
                <span className="mt-1 text-xs font-semibold text-slate-500">
                    {stars} {stars === 1 ? "Star" : "Stars"} earned
                </span>
            </div>
        </div>
    );
};
