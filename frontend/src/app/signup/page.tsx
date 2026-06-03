"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, Sparkles, AlertCircle } from "lucide-react";

export default function SignupPage() {
    const { login, apiFetch } = useAuth();
    
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [nickname, setNickname] = useState("");
    const [avatar, setAvatar] = useState("ruby"); // default avatar egg color
    const [gender, setGender] = useState("MALE");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password || !email || !nickname) {
            setError("Please fill out all fields!");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const res = await apiFetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    username,
                    password,
                    email,
                    nickname,
                    avatar,
                    gender
                })
            });

            const data = await res.json();

            if (res.ok) {
                login(data.token, data.user);
            } else {
                setError(data.message || "Registration failed. Try a different username!");
            }
        } catch (err) {
            setError("Failed to connect to backend server. Is it running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-6 overflow-hidden bg-clouds">
            {/* Cloud Background Layer */}
            <div className="absolute top-10 left-10 h-16 w-32 animate-cloud-1 bg-white rounded-full filter blur-[1px]"></div>
            <div className="absolute bottom-20 right-10 h-12 w-24 animate-cloud-2 bg-white rounded-full filter blur-[1px]"></div>

            <div className="w-full max-w-lg z-10 py-8">
                {/* Header */}
                <div className="mb-6 text-center animate-float-slow">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border-2 border-rose-300 px-3 py-1 text-xs font-black text-rose-700 uppercase tracking-widest shadow-sm">
                        <Sparkles size={12} className="text-rose-500 animate-spin" /> Hatch Your Companion
                    </span>
                    <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-slate-800" style={{ textShadow: "2px 2px 0px #fff" }}>
                        CREATE AN <span className="text-indigo-600">ACCOUNT</span>
                    </h1>
                </div>

                <div className="cartoon-card p-8 bg-white/95">
                    <h2 className="text-xl font-black text-slate-800 mb-6 text-center">Choose an Egg to Begin!</h2>

                    {error && (
                        <div className="mb-6 flex items-center gap-2 rounded-xl border-3 border-rose-500 bg-rose-50 p-4 text-rose-800 font-extrabold text-sm shadow-[3px_3px_0px_0px_rgba(239,68,68,1)]">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Interactive Egg Selector */}
                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-3 text-center">Select Your Starting Dragon Egg</label>
                            <div className="grid grid-cols-3 gap-4">
                                {/* Ruby Egg */}
                                <button
                                    type="button"
                                    onClick={() => setAvatar("ruby")}
                                    className={`relative flex flex-col items-center p-3 rounded-2xl border-3 transition-all ${
                                        avatar === "ruby"
                                            ? "border-rose-500 bg-rose-50 scale-105 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]"
                                            : "border-slate-300 bg-slate-50 hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
                                    }`}
                                >
                                    <div className="h-12 w-10 bg-gradient-to-b from-rose-300 to-rose-500 rounded-full border-2 border-slate-800 shadow-inner flex items-center justify-center">
                                        <div className="h-2 w-2 bg-rose-100 rounded-full opacity-60 absolute top-4 left-6"></div>
                                    </div>
                                    <span className="mt-2 text-xs font-black text-slate-800">Ruby Red</span>
                                </button>

                                {/* Emerald Egg */}
                                <button
                                    type="button"
                                    onClick={() => setAvatar("emerald")}
                                    className={`relative flex flex-col items-center p-3 rounded-2xl border-3 transition-all ${
                                        avatar === "emerald"
                                            ? "border-emerald-500 bg-emerald-50 scale-105 shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]"
                                            : "border-slate-300 bg-slate-50 hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
                                    }`}
                                >
                                    <div className="h-12 w-10 bg-gradient-to-b from-emerald-300 to-emerald-500 rounded-full border-2 border-slate-800 shadow-inner flex items-center justify-center">
                                        <div className="h-2 w-2 bg-emerald-100 rounded-full opacity-60 absolute top-4 left-6"></div>
                                    </div>
                                    <span className="mt-2 text-xs font-black text-slate-800">Emerald</span>
                                </button>

                                {/* Sapphire Egg */}
                                <button
                                    type="button"
                                    onClick={() => setAvatar("sapphire")}
                                    className={`relative flex flex-col items-center p-3 rounded-2xl border-3 transition-all ${
                                        avatar === "sapphire"
                                            ? "border-blue-500 bg-blue-50 scale-105 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]"
                                            : "border-slate-300 bg-slate-50 hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
                                    }`}
                                >
                                    <div className="h-12 w-10 bg-gradient-to-b from-blue-300 to-blue-500 rounded-full border-2 border-slate-800 shadow-inner flex items-center justify-center">
                                        <div className="h-2 w-2 bg-blue-100 rounded-full opacity-60 absolute top-4 left-6"></div>
                                    </div>
                                    <span className="mt-2 text-xs font-black text-slate-800">Sapphire</span>
                                </button>
                            </div>
                        </div>

                        {/* Nickname & Gender */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Trainer Name</label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    className="cartoon-input"
                                    placeholder="Your nickname..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Trainer Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="cartoon-input cursor-pointer"
                                >
                                    <option value="MALE">MALE</option>
                                    <option value="FEMALE">FEMALE</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </div>
                        </div>

                        {/* Account Details */}
                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="cartoon-input"
                                placeholder="name@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="cartoon-input"
                                placeholder="Unique username..."
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
                                placeholder="Min 6 characters..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="cartoon-btn w-full mt-4 bg-rose-400 hover:bg-rose-500 text-white disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="animate-pulse">Hatching Egg...</span>
                            ) : (
                                <>
                                    <UserPlus size={18} className="mr-2 stroke-[3px]" /> Hatch My Egg
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 border-t-4 border-dashed border-slate-200 pt-6 text-center">
                        <p className="text-sm text-slate-500 font-bold">
                            Already a Trainer?{" "}
                            <Link href="/login" className="text-indigo-600 hover:underline font-black">
                                Enter the Gate!
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
