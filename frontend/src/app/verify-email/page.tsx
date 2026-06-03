"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, AlertCircle, CheckCircle, ShieldAlert, Loader } from "lucide-react";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const [token, setToken] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const verificationAttempted = useRef(false);

    useEffect(() => {
        const queryToken = searchParams.get("token");
        if (queryToken) {
            setToken(queryToken);
        } else {
            setError("Invalid request! No verification token was provided.");
            setLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        if (!token || verificationAttempted.current) return;
        
        verificationAttempted.current = true;
        
        const verify = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8080` : "http://localhost:8080");
                const res = await fetch(`${apiBase}/api/auth/verify-email?token=${token}`);
                const data = await res.json();
                
                if (res.ok) {
                    setSuccess(data.message || "Your account email has been verified successfully! Redirecting you to login...");
                    setTimeout(() => {
                        router.push("/login");
                    }, 3500);
                } else {
                    setError(data.message || "Failed to verify email. Link may be invalid or expired.");
                }
            } catch (err) {
                setError("Failed to connect to backend server. Is it running?");
            } finally {
                setLoading(false);
            }
        };

        verify();
    }, [token, router]);

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden bg-clouds">
            {/* Whimsical Floating Background Elements */}
            <div className="absolute top-20 left-12 h-16 w-32 animate-cloud-1 bg-white rounded-full filter blur-[1px]"></div>
            <div className="absolute top-44 right-20 h-12 w-24 animate-cloud-2 bg-white rounded-full filter blur-[1px]"></div>

            <div className="w-full max-w-md z-10">
                {/* Brand Header */}
                <div className="mb-8 text-center animate-float-slow">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border-2 border-amber-300 px-3 py-1 text-xs font-black text-amber-700 uppercase tracking-widest shadow-sm">
                        <Sparkles size={12} className="text-amber-500 animate-spin" /> Email Verification
                    </span>
                    <h1 className="mt-2 text-4xl md:text-5xl font-black tracking-tight text-slate-800" style={{ textShadow: "2px 2px 0px #fff" }}>
                        DRAGON<br/>
                        <span className="text-indigo-600">MOTIVATION</span>
                    </h1>
                </div>

                <div className="cartoon-card p-8 bg-white/90 text-center">
                    <h2 className="text-2xl font-black text-slate-800 mb-6">Account Verification</h2>

                    {loading && (
                        <div className="py-12 flex flex-col items-center justify-center gap-4">
                            <Loader size={36} className="animate-spin text-indigo-600 stroke-[3px]" />
                            <p className="text-sm font-black text-slate-600 uppercase tracking-wider">
                                Contacting Dragon Server...
                            </p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="py-6 flex flex-col items-center justify-center gap-4">
                            <div className="rounded-full border-4 border-rose-500 bg-rose-50 p-3 text-rose-600 shadow-[3px_3px_0px_0px_rgba(239,68,68,1)] animate-bounce">
                                <ShieldAlert size={36} strokeWidth={3} />
                            </div>
                            <h3 className="text-lg font-black text-rose-800 uppercase tracking-tight mt-2">Verification Failed</h3>
                            <p className="text-xs text-rose-700 font-bold max-w-xs leading-relaxed">
                                {error}
                            </p>
                            <Link href="/login" className="cartoon-btn py-2.5 px-4 text-xs mt-6 bg-slate-700 hover:bg-slate-800 text-white font-extrabold shadow-[2px_2px_0px_0px_rgba(30,41,59,1)]">
                                Return to Login
                            </Link>
                        </div>
                    )}

                    {!loading && success && (
                        <div className="py-6 flex flex-col items-center justify-center gap-4">
                            <div className="rounded-full border-4 border-emerald-500 bg-emerald-50 p-3 text-emerald-600 shadow-[3px_3px_0px_0px_rgba(16,185,129,1)] animate-bounce">
                                <CheckCircle size={36} strokeWidth={3} />
                            </div>
                            <h3 className="text-lg font-black text-emerald-800 uppercase tracking-tight mt-2">Hatching Verified!</h3>
                            <p className="text-xs text-emerald-700 font-bold max-w-xs leading-relaxed">
                                {success}
                            </p>
                            <Link href="/login" className="cartoon-btn py-2.5 px-4 text-xs mt-6 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold">
                                Enter World Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
