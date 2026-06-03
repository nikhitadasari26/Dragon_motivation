"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
    Award, BarChart3, Star, TrendingUp, Calendar, Heart, ShieldAlert,
    ChevronLeft, Trophy, Sparkles, CheckCircle2, Circle 
} from "lucide-react";

export default function AnalyticsPage() {
    const { user, apiFetch } = useAuth();
    const [tasksCompleted, setTasksCompleted] = useState(0);
    const [totalTasks, setTotalTasks] = useState(0);
    const [moodLogs, setMoodLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch tasks to count completion
            const tasksRes = await apiFetch("/api/tasks");
            if (tasksRes.ok) {
                const tasks = await tasksRes.json();
                setTotalTasks(tasks.length);
                setTasksCompleted(tasks.filter((t: any) => t.completed).length);
            }

            // Fetch mood logs
            const moodRes = await apiFetch("/api/mood/history");
            if (moodRes.ok) {
                const moods = await moodRes.json();
                setMoodLogs(moods);
            }
        } catch (e) {
            console.error("Failed to load analytics: ", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate progression details
    const stars = user?.stars || 0;
    const getLevelLimits = () => {
        if (stars <= 5) return { currentMin: 0, nextMax: 6, label: "Hatch Egg", progress: (stars / 6) * 100 };
        if (stars <= 15) return { currentMin: 6, nextMax: 16, label: "Grow to Young", progress: ((stars - 6) / 10) * 100 };
        if (stars <= 35) return { currentMin: 16, nextMax: 36, label: "Ascend to Hero", progress: ((stars - 16) / 20) * 100 };
        if (stars <= 60) return { currentMin: 36, nextMax: 61, label: "Crown as King", progress: ((stars - 36) / 25) * 100 };
        return { currentMin: 61, nextMax: 999, label: "Ultimate Legend", progress: 100 };
    };

    const levelLimits = getLevelLimits();

    // Achievement badges rules (returns true/false based on user parameters)
    const achievements = [
        {
            id: "badge_egg",
            title: "First Crack",
            description: "Accumulated 6 stars and hatched your companion!",
            icon: "🐣",
            unlocked: stars >= 6,
            color: "bg-rose-100 border-rose-400 text-rose-700"
        },
        {
            id: "badge_bond",
            title: "Bond Hatchery",
            description: "Linked with an exclusive accountability partner!",
            icon: "🤝",
            unlocked: user?.partnerId !== null,
            color: "bg-emerald-100 border-emerald-400 text-emerald-700"
        },
        {
            id: "badge_focus",
            title: "Star Sparker",
            description: "Completed 5 focus goals in your daily checklist!",
            icon: "✨",
            unlocked: tasksCompleted >= 5 || stars >= 10,
            color: "bg-purple-100 border-purple-400 text-purple-700"
        },
        {
            id: "badge_mindful",
            title: "Mindful Champion",
            description: "Completed your daily mood reflections!",
            icon: "🧘",
            unlocked: moodLogs.length >= 1,
            color: "bg-sky-100 border-sky-400 text-sky-700"
        },
        {
            id: "badge_hero",
            title: "Hero Ascendant",
            description: "Evolved your dragon companion into HERO stage!",
            icon: "🛡️",
            unlocked: stars >= 36,
            color: "bg-amber-100 border-amber-400 text-amber-700"
        },
        {
            id: "badge_king",
            title: "Dragon Overlord",
            description: "Crowned your companion as a majestic KING dragon!",
            icon: "👑",
            unlocked: stars >= 61,
            color: "bg-yellow-100 border-yellow-400 text-yellow-700"
        }
    ];

    // Weekly map mock (displays checked days based on today's completions)
    const daysOfWeek = [
        { name: "Mon", active: true },
        { name: "Tue", active: tasksCompleted > 0 },
        { name: "Wed", active: false },
        { name: "Thu", active: false },
        { name: "Fri", active: false },
        { name: "Sat", active: false },
        { name: "Sun", active: false }
    ];

    return (
        <main className="relative min-h-screen bg-clouds pb-16 flex flex-col">
            {/* Header */}
            <header className="z-10 flex items-center justify-between border-b-4 border-slate-900 bg-white/70 px-6 py-4 backdrop-blur-md">
                <Link href="/dashboard" className="cartoon-btn py-1.5 px-3 bg-white text-xs text-slate-800">
                    <ChevronLeft size={14} className="mr-1 stroke-[4px]" /> Dashboard
                </Link>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">TRAINER STATISTICS</h1>
                <span className="text-2xl select-none">📊</span>
            </header>

            {/* Content grid */}
            <div className="z-10 mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 p-6 md:grid-cols-12 mt-4 flex-1">
                
                {/* LEFT: Growth, Badge board (7 cols) */}
                <section className="space-y-6 md:col-span-7">                    {/* Dragon growth slider */}
                    <div className="cartoon-card p-6 bg-white/95">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-4 border-b-2 border-slate-100 pb-1">
                            Companion Evolution Path
                        </h2>
                        
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                {user?.dragonLevel} stage
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                {levelLimits.label} ({stars}/{levelLimits.nextMax} ⭐)
                            </span>
                        </div>
 
                        {/* Custom cartoon progress slider */}
                        <div className="w-full h-7 bg-slate-100 border-3 border-slate-900 rounded-full overflow-hidden p-0.5 relative shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full border-r-3 border-slate-900 transition-all duration-700"
                                style={{ width: `${levelLimits.progress}%` }}
                            ></div>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-800 uppercase tracking-widest">
                                {Math.round(levelLimits.progress)}% Evolved
                            </span>
                        </div>

                        {/* Interactive Milestone Streak Stepper */}
                        <div className="mt-6 border-t-3 border-dashed border-slate-100 pt-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                                Dragon Milestone Streak
                            </h3>
                            <div className="relative flex items-center justify-between">
                                {/* Horizontal timeline connecting line */}
                                <div className="absolute left-2.5 right-2.5 top-5 h-1 bg-slate-200 border-b-2 border-slate-350 -z-10"></div>
                                <div 
                                    className="absolute left-2.5 top-5 h-1 bg-gradient-to-r from-amber-400 to-indigo-500 -z-10 transition-all duration-700"
                                    style={{ 
                                        width: `${
                                            stars <= 5 ? "0%" :
                                            stars <= 15 ? "25%" :
                                            stars <= 35 ? "50%" :
                                            stars <= 60 ? "75%" : "100%"
                                        }`
                                    }}
                                ></div>

                                {[
                                    { key: "EGG", label: "Egg", min: 0, max: 5, emoji: "🥚", color: "bg-indigo-400" },
                                    { key: "BABY", label: "Baby", min: 6, max: 15, emoji: "🐣", color: "bg-rose-400" },
                                    { key: "YOUNG", label: "Young", min: 16, max: 35, emoji: "🦖", color: "bg-emerald-400" },
                                    { key: "HERO", label: "Hero", min: 36, max: 60, emoji: "🛡️", color: "bg-sky-400" },
                                    { key: "KING", label: "King", min: 61, max: 999, emoji: "👑", color: "bg-amber-400" }
                                ].map((stg) => {
                                    const isCompleted = stars > stg.max;
                                    const isActive = stars >= stg.min && stars <= stg.max;
                                    const isLocked = stars < stg.min;

                                    return (
                                        <div key={stg.key} className="flex flex-col items-center">
                                            {/* Step Circle */}
                                            <div 
                                                className={`h-11 w-11 rounded-full border-3 flex items-center justify-center text-md font-bold transition-all relative ${
                                                    isCompleted 
                                                        ? "bg-emerald-400 border-slate-900 text-white shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]" 
                                                        : isActive 
                                                            ? `${stg.color} border-slate-900 text-white shadow-[4px_4px_0px_0px_rgba(30,41,59,1)] scale-110 animate-pulse`
                                                            : "bg-slate-50 border-slate-300 text-slate-400 opacity-60"
                                                }`}
                                                title={`${stg.label} Stage (${stg.min}-${stg.max} Stars)`}
                                            >
                                                {stg.emoji}
                                                {/* Mini status indicator */}
                                                {isCompleted && (
                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 border border-white text-[8px] font-black text-white">
                                                        ✓
                                                    </span>
                                                )}
                                                {isActive && (
                                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 border border-white text-[8px] font-black text-white animate-bounce">
                                                        ★
                                                    </span>
                                                )}
                                            </div>

                                            {/* Stage Label */}
                                            <span className={`text-[10px] font-black uppercase mt-2 ${
                                                isActive ? "text-slate-800 font-extrabold" : "text-slate-400"
                                            }`}>
                                                {stg.label}
                                            </span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">
                                                {stg.max === 999 ? `${stg.min}+` : `${stg.min}-${stg.max}`} ⭐
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Remaining progress motivational banner */}
                            {levelLimits.nextMax !== 999 ? (
                                <div className="mt-6 flex items-center gap-3 p-3.5 bg-indigo-50/50 rounded-2xl border-3 border-indigo-900 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
                                    <span className="text-2xl animate-bounce">🔥</span>
                                    <div className="text-left">
                                        <h4 className="text-xs font-black text-indigo-955 uppercase tracking-tight">
                                            Evo-Streak Target
                                        </h4>
                                        <p className="text-[10px] font-bold text-indigo-800 mt-0.5 normal-case">
                                            You are just <strong className="text-amber-500 font-black text-sm">{levelLimits.nextMax - stars} golden stars</strong> away from hatching/unlocking the next stage! Keep smashing those daily focus goals!
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-6 flex items-center gap-3 p-3.5 bg-emerald-50/50 rounded-2xl border-3 border-emerald-900 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
                                    <span className="text-2xl animate-float-slow">👑</span>
                                    <div className="text-left">
                                        <h4 className="text-xs font-black text-emerald-955 uppercase tracking-tight">
                                            Legendary Overlord Status
                                        </h4>
                                        <p className="text-[10px] font-bold text-emerald-800 mt-0.5 normal-case">
                                            Your dragon companion is fully evolved as the Ultimate Sovereign! You have achieved the peak level!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Achievements Badge Grid */}
                    <div className="cartoon-card p-6 bg-white/95">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-4 border-b-2 border-slate-100 pb-1">
                            Trainer Achievement Vault
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            {achievements.map((a) => (
                                <div
                                    key={a.id}
                                    className={`relative p-4 rounded-2xl border-3 border-slate-900 flex gap-3 transition-all ${
                                        a.unlocked 
                                            ? `${a.color} shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]` 
                                            : "bg-slate-50 border-slate-300 opacity-40 shadow-none cursor-not-allowed"
                                    }`}
                                >
                                    <span className="text-3xl select-none">{a.icon}</span>
                                    <div>
                                        <h4 className="font-black text-xs uppercase tracking-tight">{a.title}</h4>
                                        <p className="text-[9px] font-bold mt-0.5 leading-relaxed">
                                            {a.description}
                                        </p>
                                        {a.unlocked ? (
                                            <span className="text-[8px] font-black uppercase mt-1.5 inline-block text-emerald-600">
                                                ✓ Unlocked
                                            </span>
                                        ) : (
                                            <span className="text-[8px] font-black uppercase mt-1.5 inline-block text-slate-400">
                                                Locked
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* RIGHT: Weekly stats, Mood History (5 cols) */}
                <section className="space-y-6 md:col-span-5">
                    
                    {/* Weekly progress grid */}
                    <div className="cartoon-card p-6 bg-white/95">
                        <h2 className="text-md font-black text-slate-800 uppercase tracking-wider mb-4 border-b-2 border-slate-100 pb-1">
                            Weekly Checklist Spark
                        </h2>

                        <div className="flex justify-between items-center gap-1.5">
                            {daysOfWeek.map((day, idx) => (
                                <div key={idx} className="flex flex-col items-center flex-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                                        {day.name}
                                    </span>
                                    <div 
                                        className={`h-9 w-9 rounded-xl border-3 border-slate-950 flex items-center justify-center transition-all ${
                                            day.active 
                                                ? "bg-amber-400 text-white shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]" 
                                                : "bg-slate-50 text-slate-200 shadow-none"
                                        }`}
                                    >
                                        {day.active ? <Star size={16} fill="white" className="stroke-[2.5px]" /> : <Circle size={12} className="stroke-[2px]" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 bg-slate-50 border-2 border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-500 uppercase text-[10px]">Today's Progress</span>
                            <span className="font-black text-indigo-700">
                                {tasksCompleted} / {totalTasks} Completed
                            </span>
                        </div>
                    </div>

                    {/* Mood History Trends */}
                    <div className="cartoon-card p-6 bg-white/95 flex flex-col">
                        <h2 className="text-md font-black text-slate-800 uppercase tracking-wider mb-4 border-b-2 border-slate-100 pb-1">
                            Daily Reflection Log
                        </h2>

                        {moodLogs.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                <span className="text-2xl select-none">🧘</span>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-2">
                                    No reflections logged yet
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                                {moodLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-3 border-2 border-slate-800 rounded-xl bg-slate-50 flex items-start gap-2.5"
                                    >
                                        <span className="text-xl">
                                            {log.moodType === "HAPPY" && "🌞"}
                                            {log.moodType === "NORMAL" && "😐"}
                                            {log.moodType === "TIRED" && "😴"}
                                            {log.moodType === "OVERWHELMED" && "🤯"}
                                        </span>
                                        <div>
                                            <div className="flex justify-between items-center w-full">
                                                <h4 className="font-black text-[10px] text-slate-700 uppercase tracking-wider">
                                                    {log.moodType}
                                                </h4>
                                                <span className="text-[8px] font-black text-slate-400 uppercase ml-4">
                                                    {new Date(log.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {log.note && (
                                                <p className="text-[10px] font-bold text-slate-500 mt-1 italic leading-relaxed">
                                                    "{log.note}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
