"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Sparkles, Trophy, ShieldCheck, Flame, ChevronRight } from "lucide-react";

export default function LandingPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    // Proactive dashboard jump if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-clouds px-6 py-12 md:py-20">
            {/* Cloud and Air Decorations */}
            <div className="absolute top-10 left-[5%] h-16 w-36 animate-cloud-1 bg-white rounded-full filter blur-[1px]"></div>
            <div className="absolute top-32 right-[10%] h-12 w-28 animate-cloud-2 bg-white rounded-full filter blur-[1px]"></div>
            
            {/* Cute floating elements */}
            <div className="absolute top-1/4 left-1/4 h-8 w-8 animate-float-slow bg-rose-200 rounded-full opacity-50"></div>
            <div className="absolute bottom-1/4 right-1/4 h-12 w-12 animate-float-slow bg-amber-200 rounded-full opacity-60" style={{ animationDelay: "3s" }}></div>

            {/* Top Brand Navbar */}
            <div className="z-10 flex w-full max-w-5xl items-center justify-between">
                <span className="flex items-center gap-2 font-black text-slate-800 text-lg md:text-xl tracking-tight">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-900 bg-amber-400 text-sm shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">🐉</span>
                    DRAGON MOTIVATION
                </span>
                
                <Link href="/login" className="cartoon-btn bg-white hover:bg-slate-50 text-xs md:text-sm py-2 px-4 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                    Login Gate
                </Link>
            </div>

            {/* Hero Main Presentation */}
            <div className="z-10 my-auto flex w-full max-w-4xl flex-col items-center text-center py-12">
                {/* Floating Tag */}
                <div className="animate-float-slow">
                    <span className="inline-flex items-center gap-1.5 rounded-full border-3 border-slate-900 bg-purple-100 px-4 py-1.5 text-xs md:text-sm font-black text-purple-800 uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
                        <Sparkles size={14} className="text-purple-600 animate-pulse" /> Hatch Your Goals!
                    </span>
                </div>

                <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-800 leading-[1.1]" style={{ textShadow: "3px 3px 0px #fff" }}>
                    Tame Your Tasks.<br/>
                    Grow Your <span className="text-indigo-600">DRAGON.</span>
                </h1>

                <p className="mt-6 max-w-xl text-md md:text-lg font-bold text-slate-600 leading-relaxed">
                    Hatch a magical dragon egg that grows as you complete goals. Reduce overwhelm with customized AI encouragement, and sync with an accountability partner in real-time!
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
                    <Link href="/signup" className="cartoon-btn text-md py-4 px-8 bg-rose-400 hover:bg-rose-500 text-white font-black">
                        Hatch My Dragon Egg <ChevronRight className="ml-2 stroke-[3.5px]" size={18} />
                    </Link>
                </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="z-10 grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3 mt-4">
                {/* Card 1 */}
                <div className="cartoon-card p-6 bg-white/90 flex flex-col items-center text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-3 border-slate-800 bg-amber-400 text-xl shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
                        👶
                    </span>
                    <h3 className="mt-4 text-md font-black text-slate-800 uppercase">Dragon Growth</h3>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                        Watch your dragon grow from an Egg into a King Dragon. Unlock badges and dynamic animations as you complete daily goals!
                    </p>
                </div>

                {/* Card 2 */}
                <div className="cartoon-card p-6 bg-white/90 flex flex-col items-center text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-3 border-slate-800 bg-sky-400 text-xl shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
                        ✨
                    </span>
                    <h3 className="mt-4 text-md font-black text-slate-800 uppercase">AI Motivation</h3>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                        Logged mood tracking customizes motivational responses. Read comforting dragon stories when you feel overwhelmed.
                    </p>
                </div>

                {/* Card 3 */}
                <div className="cartoon-card p-6 bg-white/90 flex flex-col items-center text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-3 border-slate-800 bg-emerald-400 text-xl shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
                        🤝
                    </span>
                    <h3 className="mt-4 text-md font-black text-slate-800 uppercase">Accountability</h3>
                    <p className="mt-2 text-xs font-bold text-slate-500">
                        Link exclusively with a partner. Receive live WebSocket notifications when they finish a goal, and award them golden stars!
                    </p>
                </div>
            </div>

            {/* Bottom Credits */}
            <div className="mt-16 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                © {new Date().getFullYear()} Dragon Motivation • Built for consistency
            </div>
        </main>
    );
}
