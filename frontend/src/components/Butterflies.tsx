"use client";

import React, { useEffect, useState } from "react";

interface ButterflyConfig {
    id: number;
    delay: number;
    duration: number;
    scale: number;
    color: string;
    top: number;
}

export const Butterflies: React.FC = () => {
    const [butterflies, setButterflies] = useState<ButterflyConfig[]>([]);

    useEffect(() => {
        // Create 5 butterflies with varied properties
        const list: ButterflyConfig[] = [
            { id: 1, delay: 0, duration: 15, scale: 0.8, color: "#F472B6", top: 20 },
            { id: 2, delay: 3, duration: 22, scale: 0.6, color: "#60A5FA", top: 45 },
            { id: 3, delay: 6, duration: 18, scale: 0.7, color: "#FBBF24", top: 15 },
            { id: 4, delay: 9, duration: 25, scale: 0.5, color: "#34D399", top: 60 },
            { id: 5, delay: 12, duration: 19, scale: 0.65, color: "#A78BFA", top: 35 },
        ];
        setButterflies(list);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            <style>{`
                @keyframes butterfly-glide {
                    0% { left: -10%; transform: translateY(0px) rotate(5deg); }
                    25% { transform: translateY(-40px) rotate(15deg); }
                    50% { transform: translateY(20px) rotate(-10deg); }
                    75% { transform: translateY(-50px) rotate(20deg); }
                    100% { left: 110%; transform: translateY(10px) rotate(5deg); }
                }
                @keyframes wing-flutter-left {
                    0%, 100% { transform: rotateY(0deg); }
                    50% { transform: rotateY(75deg); }
                }
                @keyframes wing-flutter-right {
                    0%, 100% { transform: rotateY(0deg); }
                    50% { transform: rotateY(-75deg); }
                }
                .animate-wing-left {
                    transform-origin: right center;
                    animation: wing-flutter-left 0.12s linear infinite;
                }
                .animate-wing-right {
                    transform-origin: left center;
                    animation: wing-flutter-right 0.12s linear infinite;
                }
            `}</style>
            {butterflies.map((bf) => (
                <div
                    key={bf.id}
                    className="absolute"
                    style={{
                        top: `${bf.top}%`,
                        left: "-10%",
                        transform: `scale(${bf.scale})`,
                        animation: `butterfly-glide ${bf.duration}s linear infinite`,
                        animationDelay: `${bf.delay}s`,
                    }}
                >
                    {/* Cute Butterfly Shape */}
                    <div className="flex items-center justify-center relative w-12 h-10">
                        {/* Left Wing */}
                        <div
                            className="w-5 h-8 rounded-[40%_60%_30%_60%] absolute mr-4 right-1/2 animate-wing-left"
                            style={{ backgroundColor: bf.color, border: "1.5px solid #1E293B", opacity: 0.9 }}
                        />
                        {/* Right Wing */}
                        <div
                            className="w-5 h-8 rounded-[60%_40%_60%_30%] absolute ml-4 left-1/2 animate-wing-right"
                            style={{ backgroundColor: bf.color, border: "1.5px solid #1E293B", opacity: 0.9 }}
                        />
                        {/* Antennae */}
                        <div className="absolute w-[2px] h-6 bg-slate-800 -top-2 left-[calc(50%-1px)] origin-bottom -rotate-12" />
                        <div className="absolute w-[2px] h-6 bg-slate-800 -top-2 left-[calc(50%-1px)] origin-bottom rotate-12" />
                        {/* Body */}
                        <div className="w-1.5 h-7 bg-slate-800 rounded-full z-10 border border-slate-900" />
                    </div>
                </div>
            ))}
        </div>
    );
};
