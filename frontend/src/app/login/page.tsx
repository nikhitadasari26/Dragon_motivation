"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogIn, Sparkles, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";

export default function LoginPage() {
    const { login, apiFetch } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Email Verification Resend States
    const [showResendBtn, setShowResendBtn] = useState(false);
    const [resendEmail, setResendEmail] = useState("");
    const [resendSuccess, setResendSuccess] = useState<string | null>(null);

    const getBackendUrl = (path: string) => {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8080` : "http://localhost:8080");
        return `${apiBase}${path}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError("Please fill out all fields!");
            return;
        }

        setError(null);
        setResendSuccess(null);
        setShowResendBtn(false);
        setLoading(true);

        try {
            const res = await fetch(getBackendUrl("/api/auth/login"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                login(data.token, data.user);
            } else {
                setError(data.message || "Invalid username or password!");
                if (data.unverified) {
                    setShowResendBtn(true);
                    setResendEmail(data.email || "");
                }
            }
        } catch (err) {
            setError("Failed to connect to backend server. Is it running?");
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!resendEmail) return;
        setLoading(true);
        setError(null);
        setResendSuccess(null);

        try {
            const res = await fetch(getBackendUrl("/api/auth/resend-verification"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email: resendEmail })
            });

            const data = await res.json();

            if (res.ok) {
                setResendSuccess(data.message || "Verification link resent successfully! Please check your server console.");
                setShowResendBtn(false);
            } else {
                setError(data.message || "Failed to resend verification link.");
            }
        } catch (err) {
            setError("Failed to connect to backend server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden bg-clouds">
            {/* Whimsical Floating Background Elements */}
            <div className="absolute top-20 left-12 h-16 w-32 animate-cloud-1 bg-white rounded-full filter blur-[1px]"></div>
            <div className="absolute top-44 right-20 h-12 w-24 animate-cloud-2 bg-white rounded-full filter blur-[1px]"></div>
            
            {/* Floating Pastel Balloons */}
            <div className="absolute bottom-20 left-20 h-10 w-8 animate-float-slow bg-rose-300 rounded-full opacity-60">
                <div className="absolute bottom-[-6px] left-[3px] border-solid border-t-rose-300 border-t-6 border-x-transparent border-x-4"></div>
            </div>
            <div className="absolute top-1/4 right-1/4 h-12 w-10 animate-float-slow bg-amber-200 rounded-full opacity-60" style={{ animationDelay: "2s" }}>
                <div className="absolute bottom-[-6px] left-[4px] border-solid border-t-amber-200 border-t-6 border-x-transparent border-x-4"></div>
            </div>

            {/* Login Card Container */}
            <div className="w-full max-w-md z-10">
                {/* Brand Header */}
                <div className="mb-8 text-center animate-float-slow">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border-2 border-amber-300 px-3 py-1 text-xs font-black text-amber-700 uppercase tracking-widest shadow-sm">
                        <Sparkles size={12} className="text-amber-500 animate-spin" /> Gamified Productivity
                    </span>
                    <h1 className="mt-2 text-4xl md:text-5xl font-black tracking-tight text-slate-800" style={{ textShadow: "2px 2px 0px #fff" }}>
                        DRAGON<br/>
                        <span className="text-indigo-600">MOTIVATION</span>
                    </h1>
                    <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Consistent Focus • Real-Time Accountability
                    </p>
                </div>

                <div className="cartoon-card p-8 bg-white/90">
                    <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Welcome Back, Trainer!</h2>

                    {error && (
                        <div className="mb-6 flex flex-col gap-3 rounded-xl border-3 border-rose-500 bg-rose-50 p-4 text-rose-800 font-extrabold text-sm shadow-[3px_3px_0px_0px_rgba(239,68,68,1)] animate-fade-in">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={18} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                            {showResendBtn && (
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    className="cartoon-btn self-start text-[10px] py-1 px-3.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold border-2 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] active:translate-y-[1px]"
                                >
                                    <RefreshCw size={10} className="mr-1 stroke-[4px] animate-spin" /> Resend Verification Email
                                </button>
                            )}
                        </div>
                    )}

                    {resendSuccess && (
                        <div className="mb-6 flex items-center gap-2 rounded-xl border-3 border-emerald-500 bg-emerald-50 p-4 text-emerald-800 font-extrabold text-sm shadow-[3px_3px_0px_0px_rgba(16,185,129,1)]">
                            <CheckCircle size={18} className="shrink-0 text-emerald-600" />
                            <span>{resendSuccess}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="cartoon-input"
                                placeholder="Write your dragon name..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="cartoon-input"
                                placeholder="Write your secret password..."
                                required
                            />
                            <div className="flex justify-end mt-2">
                                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline font-black uppercase tracking-wider">
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="cartoon-btn w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="animate-pulse">Loading World...</span>
                            ) : (
                                <>
                                    <LogIn size={18} className="mr-2 stroke-[3px]" /> Enter Dragon World
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 border-t-4 border-dashed border-slate-200 pt-6 text-center">
                        <p className="text-sm text-slate-500 font-bold">
                            New here?{" "}
                            <Link href="/signup" className="text-indigo-600 hover:underline font-black">
                                Hatch a Dragon Egg!
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
