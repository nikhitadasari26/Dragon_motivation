"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAudio } from "@/context/AudioContext";
import { useWebSocket } from "@/context/WebSocketContext";
import { User, Send, Award, Heart, CheckCircle, AlertCircle, ArrowLeft, Loader, Mail, CheckSquare, Square } from "lucide-react";

export default function PartnerPage() {
    const { user, apiFetch } = useAuth();
    const { playChime } = useAudio();
    const { lastMessage } = useWebSocket();

    const [inviteEmail, setInviteEmail] = useState("");
    const [invitations, setInvitations] = useState<any[]>([]);
    const [partner, setPartner] = useState<any>(null);
    const [partnerTasks, setPartnerTasks] = useState<any[]>([]);
    const [encouragementMsg, setEncouragementMsg] = useState("");

    const [loading, setLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    const formatCompletedTime = (timeStr: string) => {
        if (!timeStr) return "";
        try {
            const date = new Date(timeStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return "";
        }
    };

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Fetch partner details
            const partnerRes = await apiFetch("/api/partner");
            if (partnerRes.status === 200) {
                const partnerData = await partnerRes.json();
                setPartner(partnerData);
                
                // Fetch partner's tasks
                const tasksRes = await apiFetch(`/api/partner/tasks`);
                if (tasksRes.ok) {
                    const tasksData = await tasksRes.json();
                    setPartnerTasks(tasksData);
                } else {
                    setPartnerTasks([]);
                }
            } else {
                setPartner(null);
            }

            // 2. Fetch pending invitations
            const inviteRes = await apiFetch("/api/partner/invitations");
            if (inviteRes.ok) {
                const inviteData = await inviteRes.json();
                setInvitations(inviteData);
            }
        } catch (e) {
            console.error("Failed to fetch partner data: ", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Sync live WS alerts
    useEffect(() => {
        if (lastMessage) {
            fetchData();
        }
    }, [lastMessage]);

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setInviteError(null);
        setInviteSuccess(null);
        setLoading(true);

        try {
            const res = await apiFetch("/api/partner/invite", {
                method: "POST",
                body: JSON.stringify({ email: inviteEmail })
            });

            const data = await res.json();
            if (res.ok) {
                setInviteSuccess(data.message);
                setInviteEmail("");
            } else {
                setInviteError(data.message);
            }
        } catch (err) {
            setInviteError("Connection to backend server failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvite = async (id: number) => {
        try {
            const res = await apiFetch(`/api/partner/accept/${id}`, {
                method: "POST"
            });
            if (res.ok) {
                playChime();
                fetchData();
            }
        } catch (e) {
            console.error("Failed to accept invite: ", e);
        }
    };

    const handleRejectInvite = async (id: number) => {
        try {
            const res = await apiFetch(`/api/partner/reject/${id}`, {
                method: "POST"
            });
            if (res.ok) {
                fetchData();
            }
        } catch (e) {
            console.error("Failed to reject invite: ", e);
        }
    };

    const handleSendEncouragement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!encouragementMsg) return;

        try {
            const res = await apiFetch("/api/partner/encourage", {
                method: "POST",
                body: JSON.stringify({ message: encouragementMsg })
            });

            if (res.ok) {
                playChime();
                setEncouragementMsg("");
                setInviteSuccess("Encouragement bubble launched successfully!");
                setTimeout(() => setInviteSuccess(null), 3000);
            }
        } catch (e) {
            console.error("Failed to send encouragement: ", e);
        }
    };

    const handleAwardStar = async (taskId: number | null) => {
        setInviteError(null);
        setInviteSuccess(null);
        try {
            const res = await apiFetch("/api/partner/award-star", {
                method: "POST",
                body: JSON.stringify({ taskId, message: "Incredible effort! High five!" })
            });
            const data = await res.json();
            if (res.ok) {
                playChime();
                setInviteSuccess("Golden Star awarded live!");
                setTimeout(() => setInviteSuccess(null), 3000);
                fetchData();
            } else {
                setInviteError(data.message || "Failed to award star.");
                setTimeout(() => setInviteError(null), 5000);
            }
        } catch (e) {
            setInviteError("Connection to backend server failed.");
            setTimeout(() => setInviteError(null), 5000);
        }
    };

    return (
        <main className="relative min-h-screen bg-clouds pb-16 flex flex-col">
            {/* Navigation Header */}
            <header className="z-10 flex items-center justify-between border-b-4 border-slate-900 bg-white/70 px-6 py-4 backdrop-blur-md">
                <Link href="/dashboard" className="cartoon-btn py-1.5 px-3 bg-white text-xs text-slate-800">
                    <ArrowLeft size={14} className="mr-1 stroke-[4px]" /> Dashboard
                </Link>
                <h1 className="text-xl font-black text-slate-800 tracking-tight">ACCOUNTABILITY CENTER</h1>
                <span className="text-2xl select-none">🤝</span>
            </header>

            {/* Global Alerts */}
            {(inviteError || inviteSuccess) && (
                <div className="z-10 mx-auto w-full max-w-5xl px-6 mt-6">
                    {inviteError && (
                        <div className="flex items-center gap-2 rounded-xl border-3 border-rose-500 bg-rose-50 p-4 text-rose-800 font-extrabold text-sm shadow-[3px_3px_0px_0px_rgba(239,68,68,1)] animate-bounce-short">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{inviteError}</span>
                        </div>
                    )}
                    {inviteSuccess && (
                        <div className="flex items-center gap-2 rounded-xl border-3 border-emerald-500 bg-emerald-50 p-4 text-emerald-800 font-extrabold text-sm shadow-[3px_3px_0px_0px_rgba(16,185,129,1)]">
                            <CheckCircle size={18} className="shrink-0" />
                            <span>{inviteSuccess}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Grid Layout Container */}
            <div className="z-10 mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 p-6 md:grid-cols-12 mt-4 flex-1">
                
                {/* LEFT SIDE: Partner Dashboard or Invite Search (7 cols) */}
                <section className="cartoon-card p-6 bg-white/95 md:col-span-7 flex flex-col">
                    {!partner ? (
                        /* Not connected state: show search invite */
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="text-center mb-8">
                                <span className="text-5xl animate-float-slow inline-block">🚀</span>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mt-3">Link Accountability Partner</h2>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider max-w-sm mx-auto leading-relaxed mt-2">
                                    Double your productivity by matching with an exclusive partner. Cheer each other live, award stars, and watch your dragons evolve!
                                </p>
                            </div>

                            <form onSubmit={handleSendInvite} className="space-y-4 max-w-md mx-auto w-full">
                                <div>
                                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Partner's Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="cartoon-input pl-11"
                                            placeholder="partner@domain.com"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="cartoon-btn w-full bg-emerald-400 hover:bg-emerald-500 text-white font-black py-3"
                                >
                                    {loading ? "Sending..." : "✨ Launch Invitation Spark"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* Connected state: show partner details */
                        <div className="flex-1 flex flex-col">
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4 pb-2 border-b-4 border-dashed border-slate-200">
                                Partner Dashboard
                            </h2>

                            {/* Partner Card detail */}
                            <div className="cartoon-card p-5 bg-gradient-to-r from-sky-50 to-indigo-50/50 border-3 flex items-center gap-4 mb-6">
                                <span className="text-5xl animate-float-slow select-none">
                                    {partner.avatar === "emerald" ? "🟢" : partner.avatar === "sapphire" ? "🔵" : "🔴"}
                                </span>
                                <div>
                                    <h3 className="text-lg font-black text-indigo-900 uppercase">{partner.nickname}</h3>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 text-white font-black text-[10px] px-2.5 py-0.5 shadow-sm uppercase mt-1">
                                        {partner.dragonLevel} companion
                                    </span>
                                    <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                                        ⭐ {partner.stars} Stars • Active Tracker
                                    </p>
                                </div>
                            </div>

                            {/* Partner checklist feed */}
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">Today's Completed Milestones</h3>
                            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
                                {partnerTasks.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                        <span className="text-2xl select-none">📝</span>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-2">
                                            No tasks have been set yet
                                        </p>
                                    </div>
                                ) : (
                                    partnerTasks.map((t) => (
                                        <div
                                            key={t.id}
                                            className="flex items-center justify-between p-3.5 bg-white border-3 border-slate-900 rounded-2xl shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="mt-0.5 stroke-[3px] text-slate-400">
                                                    {t.completed ? <CheckSquare size={18} className="text-emerald-500" /> : <Square size={18} />}
                                                </span>
                                                <div>
                                                    <h4 className={`font-black text-xs ${t.completed ? "line-through text-slate-500 animate-strike" : "text-slate-800"}`}>
                                                        {t.title}
                                                    </h4>
                                                    {t.completed && t.completedAt && (
                                                        <span className="text-[10px] text-emerald-600 font-extrabold uppercase mt-1 block">
                                                            ✓ Checked at {formatCompletedTime(t.completedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {t.completed && (
                                                <button
                                                    onClick={() => !t.starAwarded && handleAwardStar(t.id)}
                                                    disabled={t.starAwarded}
                                                    className={`cartoon-btn py-1 px-2 text-[10px] font-extrabold shadow-[1px_1px_0px_0px_rgba(30,41,59,1)] ${
                                                        t.starAwarded
                                                            ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none translate-y-0"
                                                            : "bg-amber-400 hover:bg-amber-500 text-white"
                                                    }`}
                                                >
                                                    {t.starAwarded ? "⭐ Star Awarded" : "⭐ Award Star"}
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* RIGHT SIDE: Pending Invites or live chat encourager (5 cols) */}
                <section className="space-y-6 md:col-span-5">
                    {/* Live chat encourager (only visible when connected) */}
                    {partner && (
                        <div className="cartoon-card p-6 bg-white/95">
                            <h3 className="text-md font-black text-slate-800 uppercase tracking-wider mb-4 border-b-2 border-slate-100 pb-1">
                                Launch Encouragement Bubble
                            </h3>
                            <form onSubmit={handleSendEncouragement} className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Write a quick positive note</label>
                                    <input
                                        type="text"
                                        value={encouragementMsg}
                                        onChange={(e) => setEncouragementMsg(e.target.value)}
                                        className="cartoon-input text-xs"
                                        placeholder="Keep up the fire! You got this! 🔥"
                                        required
                                        maxLength={60}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="cartoon-btn w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs"
                                >
                                    <Send size={12} className="mr-1.5 stroke-[4px]" /> Launch Bubble
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Pending Invitations list */}
                    <div className="cartoon-card p-6 bg-white/95">
                        <h3 className="text-md font-black text-slate-800 uppercase tracking-wider mb-4 border-b-2 border-slate-100 pb-1">
                            Pending Requests
                        </h3>
                        {invitations.length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                                <span className="text-2xl select-none">✉️</span>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-2">
                                    No pending invitations
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {invitations.map((invite) => (
                                    <div
                                        key={invite.id}
                                        className="p-3 border-3 border-slate-900 bg-slate-50 rounded-2xl flex flex-col gap-2"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-6 w-6 rounded-full bg-indigo-100 border border-indigo-400 flex items-center justify-center text-xs font-black">
                                                👤
                                            </div>
                                            <div>
                                                <h4 className="font-black text-xs text-slate-800">{invite.sender.nickname}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{invite.sender.email}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <button
                                                onClick={() => handleAcceptInvite(invite.id)}
                                                className="cartoon-btn py-1 px-2 text-[10px] bg-emerald-400 hover:bg-emerald-500 text-white font-black shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectInvite(invite.id)}
                                                className="cartoon-btn py-1 px-2 text-[10px] bg-rose-400 hover:bg-rose-500 text-white font-black shadow-[1px_1px_0px_0px_rgba(30,41,59,1)]"
                                            >
                                                Reject
                                            </button>
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
