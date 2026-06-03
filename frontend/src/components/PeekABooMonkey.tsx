"use client";

import React, { useEffect, useState } from "react";

export const PeekABooMonkey: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState<{ edge: "top" | "bottom"; left: string }>({ edge: "top", left: "50%" });
    const [monkeyIcon, setMonkeyIcon] = useState("🐵");
    const [monkeyText, setMonkeyText] = useState("Ooh ooh! 🍌");

    const monkeyEmojis = ["🐵", "🐒", "🙈", "🙉", "🙊"];
    const monkeyPhrases = [
        "Peek-a-boo! 🙈",
        "Are you there? 👀",
        "What are you doing? 🍌",
        "Ooh ooh! 🐒",
        "Keep going! 🌟",
        "I see you! 🐵"
    ];

    useEffect(() => {
        const triggerPeek = () => {
            const randomEdge = Math.random() > 0.5 ? "top" : "bottom";
            const randomLeft = `${Math.floor(Math.random() * 70) + 15}%`; // 15% to 85%
            const randomIcon = monkeyEmojis[Math.floor(Math.random() * monkeyEmojis.length)];
            const randomPhrase = monkeyPhrases[Math.floor(Math.random() * monkeyPhrases.length)];
            
            setPosition({ edge: randomEdge, left: randomLeft });
            setMonkeyIcon(randomIcon);
            setMonkeyText(randomPhrase);
            setVisible(true);

            // Hide after 4 seconds
            setTimeout(() => {
                setVisible(false);
            }, 4000);
        };

        // Trigger occasionally: every 20 seconds
        const interval = setInterval(() => {
            triggerPeek();
        }, 20000); 

        // Also trigger once initially after 7 seconds
        const initialTimer = setTimeout(() => {
            triggerPeek();
        }, 7000);

        return () => {
            clearInterval(interval);
            clearTimeout(initialTimer);
        };
    }, []);

    return (
        <>
            <style>{`
                @keyframes monkey-wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-8deg); }
                    75% { transform: rotate(8deg); }
                }
                .animate-monkey-wiggle {
                    animation: monkey-wiggle 0.5s ease-in-out infinite alternate;
                }
            `}</style>
            <div
                className={`fixed z-50 transition-all duration-700 ease-out select-none pointer-events-none`}
                style={{
                    left: position.left,
                    top: position.edge === "top" ? (visible ? "0px" : "-160px") : "auto",
                    bottom: position.edge === "bottom" ? (visible ? "0px" : "-160px") : "auto",
                    transform: `translateX(-50%) ${position.edge === "top" ? "" : "scaleY(-1)"}`,
                }}
            >
                <div className="flex flex-col items-center">
                    {/* Speech bubble */}
                    {visible && (
                        <div 
                            className="bg-white/95 border-2 border-slate-700 px-3 py-1 rounded-full text-xs font-black text-slate-700 shadow-md mb-2 animate-bounce"
                            style={{ transform: position.edge === "top" ? "" : "scaleY(-1)" }}
                        >
                            {monkeyText}
                        </div>
                    )}
                    {/* Monkey Body */}
                    <div className="text-8xl filter drop-shadow-xl animate-monkey-wiggle">
                        {monkeyIcon}
                    </div>
                </div>
            </div>
        </>
    );
};
