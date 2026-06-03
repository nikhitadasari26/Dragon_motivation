"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, AlertCircle, KeyRound, ChevronLeft, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getBackendUrl = (path: string) => {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8080` : "http://localhost:8080");
        return `${apiBase}${path}`;
    };

    useEffect(() => {
        const queryToken = searchParams.get("token");
        if (queryToken) {
            setToken(queryToken);
        } else {
            setError("Invalid request! No password reset token was provided.");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError("Reset token is missing! Please request a new password reset link.");
            return;
        }
        if (!password || !confirmPassword) {
            setError("Please fill out all fields!");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const res = await fetch(getBackendUrl("/api/auth/reset-password"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, password })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message || "Your password has been reset successfully! Redirecting you to login...");
                setPassword("");
                setConfirmPassword("");
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
            } else {
                setError(data.message || "Failed to reset password. Link may be expired.");
            }
        } catch (err) {
            setError("Failed to connect to backend server. Is it running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden bg-clouds">
            {/* Whimsical Floating Background Elements */}
            <div className="absolute top-20 left-12 h-16 w-32 animate-cloud-1 bg-white rounded-full filter blur-[1px]"></div>
            <div className="absolute top-44 right-20 h-12 w-24 animate-cloud-2 bg-white rounded-full filter blur-[1px]"></div>

            <div className="w-full max-w-md z-10">
                {/* Brand Header */}
                <div className="mb-8 text-center animate-float-slow">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border-2 border-amber-300 px-3 py-1 text-xs font-black text-amber-700 uppercase tracking-widest shadow-sm">
                        <Sparkles size={12} className="text-amber-500 animate-spin" /> Password Reset
                    </span>
                    <h1 className="mt-2 text-4xl md:text-5xl font-black tracking-tight text-slate-800" style={{ textShadow: "2px 2px 0px #fff" }}>
                        DRAGON<br/>
                        <span className="text-indigo-600">MOTIVATION</span>
                    </h1>
                </div>

                <div className="cartoon-card p-8 bg-white/90">
                    <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Reset Password</h2>

                    {error && (
                        <div className="mb-6 flex items-center gap-2 rounded-xl border-3 border-rose-500 bg-rose-50 p-4 text-rose-800 font-extrabold text-sm shadow-[3px_3px_0px_0px_rgba(239,68,68,1)]">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 flex flex-col gap-2 rounded-xl border-3 border-emerald-500 bg-emerald-50 p-4 text-emerald-800 font-bold text-sm shadow-[3px_3px_0px_0px_rgba(16,185,129,1)]">
                            <div className="flex items-center gap-2">
                                <CheckCircle size={18} className="shrink-0 text-emerald-600" />
                                <span className="font-extrabold">Password Updated!</span>
                            </div>
                            <p className="text-xs text-emerald-700 leading-relaxed font-semibold">
                                {success}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <p className="text-xs text-slate-500 font-bold leading-relaxed mb-4 text-center">
                            Please type your new strong password below to regain full access to your dragon.
                        </p>

                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="cartoon-input"
                                placeholder="Choose a secure new password..."
                                required
                                disabled={!token}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-2">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="cartoon-input"
                                placeholder="Verify your new password..."
                                required
                                disabled={!token}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="cartoon-btn w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="animate-pulse">Locking Gates...</span>
                            ) : (
                                <>
                                    <KeyRound size={18} className="mr-2 stroke-[3px]" /> Update Password
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 border-t-4 border-dashed border-slate-200 pt-6 text-center">
                        <Link href="/login" className="inline-flex items-center text-xs text-slate-500 hover:text-indigo-600 hover:underline font-black uppercase tracking-wider">
                            <ChevronLeft size={14} className="mr-1 stroke-[4px]" /> Back to Login Gate
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
