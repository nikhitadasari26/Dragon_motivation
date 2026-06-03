"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    nickname: string;
    avatar: string;
    gender: string;
    stars: number;
    dragonLevel: string;
    partnerId: number | null;
    totalXp?: number;
    streak?: number;
    longestStreak?: number;
}

interface AuthContextType {
    user: UserProfile | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, user: UserProfile) => void;
    logout: () => void;
    updateUser: (updatedFields: Partial<UserProfile>) => void;
    apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Hydrate state from localStorage on load
    useEffect(() => {
        const storedToken = localStorage.getItem("dragon_auth_token");
        const storedUser = localStorage.getItem("dragon_auth_user");

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                setIsAuthenticated(true);
            } catch (e) {
                localStorage.removeItem("dragon_auth_token");
                localStorage.removeItem("dragon_auth_user");
            }
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, newUser: UserProfile) => {
        localStorage.setItem("dragon_auth_token", newToken);
        localStorage.setItem("dragon_auth_user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setIsAuthenticated(true);
        router.push("/dashboard");
    };

    const logout = () => {
        localStorage.removeItem("dragon_auth_token");
        localStorage.removeItem("dragon_auth_user");
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        router.push("/login");
    };

    const updateUser = (updatedFields: Partial<UserProfile>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updatedFields };
        localStorage.setItem("dragon_auth_user", JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    // A helper fetch wrapper that automatically appends the JWT bearer token
    const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8080` : "http://localhost:8080");
        const headers = new Headers(options.headers || {});
        
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        
        if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        const response = await fetch(`${baseUrl}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            logout();
        }

        return response;
    };

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-b from-sky-100 to-indigo-100 font-bold text-indigo-900">
                <div className="flex flex-col items-center gap-4">
                    {/* Cute bouncing balloon loader */}
                    <div className="h-16 w-16 animate-bounce rounded-full bg-rose-400 shadow-md"></div>
                    <span className="animate-pulse tracking-wide font-black">Spawning your Dragon World...</span>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, updateUser, apiFetch }}>
            {children}
        </AuthContext.Provider>
    );
};
