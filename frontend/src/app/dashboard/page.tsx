"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAudio } from "@/context/AudioContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { DragonMascot } from "@/components/DragonMascot";
import { ConfettiShower } from "@/components/ConfettiShower";
import { FireShower } from "@/components/FireShower";
import { PeekABooMonkey } from "@/components/PeekABooMonkey";
import { 
    Plus, CheckSquare, Square, Trash2, Award, 
    Heart, MessageCircle, AlertCircle, Calendar, Sparkles, User, RefreshCw, LogOut 
} from "lucide-react";

interface Task {
    id: number;
    title: string;
    description: string;
    completed: boolean;
}

export default function DashboardPage() {
    const { user, apiFetch, logout, updateUser } = useAuth();
    const { playChime, playLevelUp, setMusicMood } = useAudio();
    const { lastMessage, clearLastMessage } = useWebSocket();
    const router = useRouter();

    // App states
    const [tasks, setTasks] = useState<Task[]>([]);
    const [partner, setPartner] = useState<any>(null);
    const [showMoodModal, setShowMoodModal] = useState(false);
    const [showTaskPopup, setShowTaskPopup] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showOverwhelmedOverlay, setShowOverwhelmedOverlay] = useState(false);
    const [overwhelmedQuote, setOverwhelmedQuote] = useState("");
    const [overwhelmedStory, setOverwhelmedStory] = useState("");

    // Form inputs
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDesc, setNewTaskDesc] = useState("");
    const [moodNote, setMoodNote] = useState("");

    // AI bubble content
    const [aiQuote, setAiQuote] = useState("Hey there! Ready to make some magical progress today? Let's check a task!");
    const [aiStory, setAiStory] = useState("");
    const [dragonMascotState, setDragonMascotState] = useState<"idle" | "celebrate" | "sleep" | "fly">("idle");
    const [activeConfetti, setActiveConfetti] = useState(false);
    const [activeFireShower, setActiveFireShower] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [achievements, setAchievements] = useState<any[]>([]);

    const isBlastingRef = useRef(false);

    const triggerCelebrate = (playAudio = true) => {
        if (isBlastingRef.current) return;
        isBlastingRef.current = true;

        if (playAudio) {
            playChime();
        }
        setActiveConfetti(true);
        setActiveFireShower(true);
        setDragonMascotState("celebrate");
        
        setTimeout(() => {
            setDragonMascotState("idle");
        }, 1500);

        setTimeout(() => {
            isBlastingRef.current = false;
        }, 3000); // 3-second cool-down matches animations
    };

    // Initial data fetch
    const fetchData = async () => {
        if (!user) return;
        try {
            // 1. Fetch tasks
            const taskRes = await apiFetch("/api/tasks");
            if (taskRes.ok) {
                const taskData = await taskRes.json();
                setTasks(taskData);
            }

            // 2. Fetch partner status
            const partnerRes = await apiFetch("/api/partner");
            if (partnerRes.status === 200) {
                const partnerData = await partnerRes.json();
                setPartner(partnerData);
            }

            // 3. Check if mood logged today
            const latestMoodRes = await apiFetch("/api/mood/latest");
            if (latestMoodRes.status === 204 || latestMoodRes.status === 404) {
                // No mood logged today, open modal
                setShowMoodModal(true);
            } else if (latestMoodRes.ok && latestMoodRes.status !== 204) {
                try {
                    const latestMood = await latestMoodRes.json();
                    if (latestMood && latestMood.moodType) {
                        setMusicMood(latestMood.moodType);
                    } else {
                        setShowMoodModal(true);
                    }
                } catch (jsonErr) {
                    console.warn("Failed to parse latest mood JSON:", jsonErr);
                    setShowMoodModal(true);
                }
            }

            // 4. Fetch achievements
            const achievementRes = await apiFetch("/api/achievements");
            if (achievementRes.ok) {
                const achievementData = await achievementRes.json();
                setAchievements(achievementData);
            }
        } catch (e) {
            console.error("Failed to load initial dashboard data: ", e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Reactive WebSocket handling inside dashboard
    useEffect(() => {
        if (lastMessage && lastMessage.type === "STAR_RECEIVED") {
            // Play magical burst
            triggerCelebrate(true);
            setAiQuote(`Yay! Your partner just sent you a star! "${lastMessage.message}"`);
            
            // Re-fetch partner details to sync stars
            fetchData();
        } 
        else if (lastMessage && lastMessage.type === "PARTNER_TASK_COMPLETED") {
            // Live update partner tasks
            fetchData();
        }
        else if (lastMessage && lastMessage.type === "ACHIEVEMENT_EARNED") {
            // Live refresh achievements and celebrate trainer badge unlock!
            fetchData();
            triggerCelebrate(true);
            setAiQuote(`Outstanding! You just unlocked a new Trainer Badge: "${lastMessage.name}"!`);
        }
    }, [lastMessage]);

    // Handle mood submission
    const handleMoodSelect = async (moodType: string) => {
        try {
            const res = await apiFetch("/api/mood", {
                method: "POST",
                body: JSON.stringify({ mood: moodType, note: moodNote })
            });

            if (res.ok) {
                setMusicMood(moodType as any);
                setShowMoodModal(false);
                setAiQuote(`I see you're feeling ${moodType.toLowerCase()} today. Don't worry, your dragon is here to support you!`);
            }
        } catch (e) {
            console.error("Failed to submit mood: ", e);
        }
    };

    // Task CRUD
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle) return;

        try {
            const res = await apiFetch("/api/tasks", {
                method: "POST",
                body: JSON.stringify({ title: newTaskTitle, description: newTaskDesc })
            });

            if (res.ok) {
                const newlyCreated = await res.json();
                setTasks([newlyCreated, ...tasks]);
                setNewTaskTitle("");
                setNewTaskDesc("");
                setShowAddModal(false);
            }
        } catch (e) {
            console.error("Failed to add task: ", e);
        }
    };

    const handleDeleteTask = async (id: number) => {
        try {
            const res = await apiFetch(`/api/tasks/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setTasks(tasks.filter(t => t.id !== id));
            }
        } catch (e) {
            console.error("Failed to delete task: ", e);
        }
    };

    const handleToggleTask = async (id: number) => {
        try {
            const res = await apiFetch(`/api/tasks/${id}/toggle`, {
                method: "POST"
            });

            if (res.ok) {
                const updatedTask = await res.json();
                
                // If marked completed, trigger chimes and celebration popup
                if (updatedTask.completed) {
                    triggerCelebrate(true);
                    setSelectedTaskId(id);
                    setShowTaskPopup(true);
                }

                setTasks(tasks.map(t => t.id === id ? updatedTask : t));

                // Fetch fresh user profile to update stars count and level instantly in the header!
                const meRes = await apiFetch("/api/auth/me");
                if (meRes.ok) {
                    const freshUser = await meRes.json();
                    updateUser(freshUser);
                }
            }
        } catch (e) {
            console.error("Failed to toggle task: ", e);
        }
    };

    // Handle Motivation Popup Decision Paths
    const handleMotivationChoice = async (choice: "continue" | "rest") => {
        setShowTaskPopup(false);
        try {
            const res = await apiFetch("/api/motivation", {
                method: "POST",
                body: JSON.stringify({ path: choice })
            });

            if (res.ok) {
                const motivation = await res.json();

                if (choice === "continue") {
                    setAiQuote(motivation.quote);
                    setAiStory(motivation.story);
                    setDragonMascotState("fly");
                } else {
                    setOverwhelmedQuote(motivation.quote);
                    setOverwhelmedStory(motivation.story);
                    setShowOverwhelmedOverlay(true);

                    // Keep the mascot speech bubble simple & story-free
                    setAiQuote("Take a slow breath. Your dragon companion is sleeping and dreaming...");
                    setAiStory("");
                    setDragonMascotState("sleep");
                    setMusicMood("TIRED"); // Soothe music scale
                }
            }
        } catch (e) {
            console.error("Failed to fetch AI motivation: ", e);
        }
    };

    // Award partner star
    const handleAwardPartnerStar = async () => {
        if (!partner) return;
        try {
            const res = await apiFetch("/api/partner/award-star", {
                method: "POST",
                body: JSON.stringify({ message: "Amazing effort! You're making stars fly!" })
            });

            if (res.ok) {
                const data = await res.json();
                // Play client chime to confirm
                playChime();
                setAiQuote("You awarded a star to your partner! They've been notified live.");
                fetchData(); // sync
            }
        } catch (e) {
            console.error("Failed to award partner star: ", e);
        }
    };

    return (
        <main className="relative min-h-screen bg-clouds flex flex-col pb-16">
            <ConfettiShower active={activeConfetti} onComplete={() => setActiveConfetti(false)} />
            <FireShower active={activeFireShower} onComplete={() => setActiveFireShower(false)} themeColor={user?.avatar || "ruby"} />
            <PeekABooMonkey />

            {/* Clouds background */}
            <div className="absolute top-12 left-10 h-16 w-36 animate-cloud-1 bg-white rounded-full filter blur-[1px]"></div>
            <div className="absolute top-1/2 right-12 h-12 w-28 animate-cloud-2 bg-white rounded-full filter blur-[1px]"></div>

            {/* Dashboard Header Bar */}
            <header className="z-10 flex items-center justify-between border-b-4 border-slate-900 bg-white/70 px-6 py-4 backdrop-blur-md">
                <span className="flex items-center gap-2 font-black text-slate-800 tracking-tight">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-900 bg-amber-400 text-sm shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">🐉</span>
                    DRAGON MOTIVATION
                </span>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border-2 border-slate-800 bg-orange-100 px-3 py-1 text-xs font-black text-orange-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]" title={`Longest Streak: ${user?.longestStreak || 0} days`}>
                        🔥 {user?.streak || 0} Day Streak
                    </span>

                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border-2 border-slate-800 bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                        ⭐ {user?.stars || 0} Stars
                    </span>
                    
                    <Link href="/partner" className="cartoon-btn text-xs py-1.5 px-3 bg-emerald-400 hover:bg-emerald-500 text-white shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                        Accountability
                    </Link>

                    <Link href="/analytics" className="cartoon-btn text-xs py-1.5 px-3 bg-sky-400 hover:bg-sky-500 text-white shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                        Stats
                    </Link>

                    <button
                        onClick={logout}
                        className="h-9 w-9 rounded-xl border-2 border-slate-800 bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center transition shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
                        title="Logout Gate"
                    >
                        <LogOut size={16} strokeWidth={3} />
                    </button>
                </div>
            </header>

            {/* Main Grid View */}
            <div className="z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 p-6 md:grid-cols-12 mt-4 flex-1">
                
                {/* LEFT COLUMN: Daily tasks list (7 cols) */}
                <section className="cartoon-card p-6 bg-white/95 md:col-span-7 flex flex-col">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b-4 border-dashed border-slate-200">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Today's Focus</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                                Small tasks, major dragon growth! • {tasks.filter(t => t.completed).length} Done / {tasks.filter(t => !t.completed).length} Left
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="cartoon-btn py-2 px-3 text-xs bg-indigo-500 hover:bg-indigo-600 text-white"
                        >
                            <Plus size={14} className="mr-1 stroke-[4px]" /> Add Goal
                        </button>
                    </div>

                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 border-4 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex-1">
                            <span className="text-4xl animate-float-slow">🌟</span>
                            <h3 className="mt-4 font-black text-slate-700 text-md uppercase">Your board is empty!</h3>
                            <p className="mt-1 text-xs font-bold text-slate-400 text-center max-w-xs leading-relaxed">
                                Add some daily tasks to start earning golden stars and hatch your dragon egg!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-1">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className={`relative flex items-center justify-between p-4 rounded-2xl border-3 border-slate-900 transition-all ${
                                        task.completed 
                                            ? "bg-emerald-50/50 border-emerald-900 opacity-75 shadow-[2px_2px_0px_0px_rgba(6,95,70,1)]" 
                                            : "bg-white hover:translate-y-[-2px] shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]"
                                    }`}
                                >
                                    <button
                                        onClick={() => handleToggleTask(task.id)}
                                        className="flex items-start gap-3 flex-1 text-left cursor-pointer"
                                    >
                                        <span className="mt-0.5 stroke-[3px] text-indigo-600">
                                            {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                                        </span>
                                        <div>
                                            <h4 className={`font-black text-sm ${task.completed ? "line-through text-slate-500" : "text-slate-800"}`}>
                                                {task.title}
                                            </h4>
                                            {task.description && (
                                                <p className="text-xs text-slate-500 font-bold mt-1 max-w-sm line-clamp-2">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="h-8 w-8 rounded-xl border-2 border-slate-800 bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition"
                                        title="Delete Goal"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* RIGHT COLUMN: Mascot Cage & AI bubble & Partner (5 cols) */}
                <section className="space-y-6 md:col-span-5">
                    
                    {/* Companion Core Card */}
                    <div className="cartoon-card p-6 bg-white/95 flex flex-col items-center">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-wider self-start mb-2 border-b-2 border-slate-100 w-full pb-1">
                            Companion Mascot
                        </h2>

                        <div 
                            id="dragon-mascot-container"
                            className="cursor-pointer hover:scale-105 transition-all duration-300 active:scale-95 flex items-center justify-center"
                            onClick={() => triggerCelebrate(true)}
                            title="Click to make your dragon breathe fire!"
                        >
                            <DragonMascot stars={user?.stars || 0} state={dragonMascotState} avatarColor={user?.avatar || "ruby"} />
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 rounded-full border-2 border-slate-800 bg-indigo-100 px-3 py-1 text-xs font-black text-indigo-800 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                            ✨ {user?.totalXp || 0} XP
                        </div>

                        {/* Speech bubble */}
                        <div className="relative mt-6 w-full rounded-2xl border-3 border-slate-900 bg-amber-50 p-4 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
                            {/* Dialogue triangle pointing up */}
                            <div className="absolute top-[-10px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-t-3 border-l-3 border-slate-900 bg-amber-50"></div>
                            
                            <p className="text-xs font-black text-amber-900 text-center leading-relaxed">
                                "{aiQuote}"
                            </p>
                            {aiStory && (
                                <p className="mt-3 border-t-2 border-dashed border-amber-200/50 pt-2 text-[11px] font-bold text-amber-800 text-center italic">
                                    📖 Story: {aiStory}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Live Partner Station */}
                    <div className="cartoon-card p-5 bg-white/95">
                        <h3 className="text-md font-black text-slate-800 uppercase tracking-wider mb-3">Accountability Link</h3>
                        
                        {!partner ? (
                            <div className="text-center py-4">
                                <p className="text-xs font-bold text-slate-500 mb-3">
                                    You don't have a linked accountability partner yet. Double your motivation!
                                </p>
                                <Link href="/partner" className="cartoon-btn text-xs py-1.5 px-3 bg-emerald-400 hover:bg-emerald-500 text-white">
                                    Invite Partner
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-slate-50 border-3 border-slate-900 p-3 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🐉</span>
                                    <div>
                                        <h4 className="font-black text-xs text-slate-800 uppercase">{partner.nickname}</h4>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">
                                            {partner.dragonLevel} • ⭐ {partner.stars} Stars
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href="/partner"
                                    className="cartoon-btn py-1.5 px-2 text-[10px] bg-emerald-400 hover:bg-emerald-500 text-white font-extrabold shadow-[1px_1px_0px_0px_rgba(30,41,59,1)] animate-pulse"
                                >
                                    Visit Board
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Achievements Badge Station */}
                    <div className="cartoon-card p-5 bg-white/95 mt-6 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]">
                        <h3 className="text-md font-black text-slate-800 uppercase tracking-wider mb-3">Trainer Badges</h3>
                        <div className="grid grid-cols-5 gap-2 justify-items-center">
                            {achievements.map((ach) => (
                                <div
                                    key={ach.id}
                                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(30,41,59,1)] transition-transform duration-200 hover:scale-110 group ${
                                        ach.earned 
                                            ? "bg-amber-100 text-amber-500 scale-100 cursor-pointer" 
                                            : "bg-slate-100 text-slate-400 opacity-40 filter grayscale"
                                    }`}
                                    title={`${ach.name}: ${ach.description} (${ach.requiredStars} Stars)`}
                                >
                                    <span className="text-lg select-none">
                                        {ach.requiredStars <= 6 ? "🥚" : 
                                         ach.requiredStars <= 16 ? "👶" : 
                                         ach.requiredStars <= 36 ? "✨" : 
                                         ach.requiredStars <= 61 ? "👑" : "🔥"}
                                    </span>
                                    {/* Tooltip on hover */}
                                    <div className="pointer-events-none absolute bottom-12 left-1/2 z-30 w-44 -translate-x-1/2 scale-0 rounded-lg border-2 border-slate-900 bg-slate-800 p-2 text-[10px] text-white shadow-md transition-all duration-150 group-hover:scale-100">
                                        <p className="font-extrabold uppercase text-amber-400">{ach.name}</p>
                                        <p className="font-semibold text-slate-200 mt-0.5 leading-tight">{ach.description}</p>
                                        <p className="font-extrabold text-[9px] text-slate-400 mt-1">Requires {ach.requiredStars} Stars {ach.earned && "• Unlocked! 🎉"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* --- MODAL 1: START OF DAY MOOD CHECK-IN --- */}
            {showMoodModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-fade-in">
                    <div className="cartoon-card max-w-md w-full p-6 bg-white animate-scale-up z-50">
                        <div className="text-center mb-6">
                            <span className="text-4xl animate-bounce inline-block">🌞</span>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mt-2">Mood Check-In</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                                How are you feeling before starting?
                            </p>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {/* Happy */}
                            <button
                                type="button"
                                onClick={() => handleMoodSelect("HAPPY")}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl border-3 border-slate-900 bg-yellow-50 hover:bg-yellow-100 transition shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] active:translate-y-[2px]"
                            >
                                <span className="text-2xl">🌞</span>
                                <span className="mt-1 text-[10px] font-black text-slate-800">HAPPY</span>
                            </button>
                            {/* Normal */}
                            <button
                                type="button"
                                onClick={() => handleMoodSelect("NORMAL")}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl border-3 border-slate-900 bg-sky-50 hover:bg-sky-100 transition shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] active:translate-y-[2px]"
                            >
                                <span className="text-2xl">😐</span>
                                <span className="mt-1 text-[10px] font-black text-slate-800">NORMAL</span>
                            </button>
                            {/* Tired */}
                            <button
                                type="button"
                                onClick={() => handleMoodSelect("TIRED")}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl border-3 border-slate-900 bg-purple-50 hover:bg-purple-100 transition shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] active:translate-y-[2px]"
                            >
                                <span className="text-2xl">😴</span>
                                <span className="mt-1 text-[10px] font-black text-slate-800">TIRED</span>
                            </button>
                            {/* Overwhelmed */}
                            <button
                                type="button"
                                onClick={() => handleMoodSelect("OVERWHELMED")}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl border-3 border-slate-900 bg-rose-50 hover:bg-rose-100 transition shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] active:translate-y-[2px]"
                            >
                                <span className="text-2xl">🤯</span>
                                <span className="mt-1 text-[10px] font-black text-slate-800">PANIC</span>
                            </button>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Add a quick reflection note (optional)</label>
                            <textarea
                                value={moodNote}
                                onChange={(e) => setMoodNote(e.target.value)}
                                className="cartoon-input text-xs h-20 resize-none"
                                placeholder="Any thoughts on your mind?"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: COMPLETED GOAL MOTIVATION SYSTEM --- */}
            {showTaskPopup && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="cartoon-card max-w-sm w-full p-6 bg-white animate-scale-up text-center border-rose-400">
                        <span className="text-5xl animate-bounce inline-block">🎉</span>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mt-2">Goal Smashed!</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                            "Amazing job! You're making progress!"
                        </p>

                        <div className="mt-6 border-t-4 border-dashed border-slate-200 pt-4">
                            <h4 className="font-black text-xs text-slate-700 uppercase tracking-wider mb-4">
                                Would you like to continue working?
                            </h4>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => handleMotivationChoice("continue")}
                                    className="cartoon-btn w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black"
                                >
                                    🔥 Yes, I want to continue!
                                </button>
                                <button
                                    onClick={() => handleMotivationChoice("rest")}
                                    className="cartoon-btn w-full py-3 bg-amber-400 hover:bg-amber-500 text-white font-black"
                                >
                                    🧸 No, I feel overwhelmed.
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: ADD TASK FORM --- */}
            {showAddModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
                    <div className="cartoon-card max-w-md w-full p-6 bg-white animate-scale-up">
                        <div className="flex items-center justify-between mb-4 border-b-2 border-slate-100 pb-2">
                            <h3 className="text-lg font-black text-slate-800 uppercase">Hatch a New Goal</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleAddTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase mb-1">Goal Title</label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="cartoon-input"
                                    placeholder="What are we focusing on?"
                                    required
                                    maxLength={40}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase mb-1">Details (Optional)</label>
                                <textarea
                                    value={newTaskDesc}
                                    onChange={(e) => setNewTaskDesc(e.target.value)}
                                    className="cartoon-input h-24 resize-none"
                                    placeholder="Any notes or steps to break down..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="cartoon-btn w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 mt-2"
                            >
                                ✨ Spawn Goal Card
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: FULL-PAGE OVERWHELMED REST STORY OVERLAY --- */}
            {showOverwhelmedOverlay && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-purple-100 to-indigo-100 p-6 overflow-y-auto">
                    {/* Whimsical drifting clouds and bubbles background */}
                    <div className="absolute top-16 left-12 h-16 w-32 animate-cloud-1 bg-white rounded-full filter blur-[2px]"></div>
                    <div className="absolute bottom-24 right-16 h-12 w-24 animate-cloud-2 bg-white rounded-full filter blur-[2px]"></div>
                    
                    <div className="cartoon-card max-w-2xl w-full p-8 md:p-12 bg-white/95 text-center shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] z-10 animate-scale-up">
                        <span className="text-6xl animate-float-slow inline-block">🧸</span>
                        
                        <h2 className="mt-6 text-2xl md:text-3xl font-black text-indigo-950 uppercase tracking-tight" style={{ textShadow: "2px 2px 0px #fff" }}>
                            Time to Rest Your Mind
                        </h2>
                        
                        {/* Cozy resting quote */}
                        <div className="mt-6 p-4 rounded-2xl border-3 border-slate-900 bg-amber-50 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]">
                            <p className="text-sm md:text-md font-black text-amber-900 leading-relaxed">
                                "{overwhelmedQuote}"
                            </p>
                        </div>

                        {/* Large Comforting Simple Story */}
                        <div className="mt-8 text-left border-t-4 border-dashed border-slate-200 pt-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Your Cozy Companion Story</h3>
                            <p className="text-sm md:text-md font-bold text-slate-600 leading-relaxed bg-indigo-50/30 p-5 rounded-2xl border-2 border-slate-200">
                                {overwhelmedStory}
                            </p>
                        </div>

                        {/* Under that it has to get close option then it will take back to the statistics */}
                        <div className="mt-8">
                            <button
                                onClick={() => {
                                    setShowOverwhelmedOverlay(false);
                                    router.push("/analytics"); // Take back to the statistics page!
                                }}
                                className="cartoon-btn py-3 px-6 bg-rose-400 hover:bg-rose-500 text-white font-black text-xs w-full md:w-auto"
                            >
                                Close & View My Statistics
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
