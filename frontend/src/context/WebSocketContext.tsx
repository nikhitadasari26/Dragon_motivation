"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";
import { useAudio } from "./AudioContext";

interface WebSocketMessage {
    type: "PARTNER_TASK_COMPLETED" | "STAR_RECEIVED" | "PARTNER_ENCOURAGEMENT" | "PARTNER_CONNECTED" | "ACHIEVEMENT_EARNED";
    partnerId?: number;
    partnerNickname?: string;
    partnerAvatar?: string;
    taskId?: number;
    taskTitle?: string;
    totalStars?: number;
    dragonLevel?: string;
    leveledUp?: boolean;
    message?: string;
    timestamp?: string;
    senderNickname?: string;
    achievementId?: number;
    name?: string;
    description?: string;
}

interface WebSocketContextType {
    connected: boolean;
    lastMessage: WebSocketMessage | null;
    clearLastMessage: () => void;
    sendEncouragement: (msg: string) => void;
    awardStarToPartner: (taskId: number | null, note: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error("useWebSocket must be used within a WebSocketProvider");
    }
    return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, updateUser, token } = useAuth();
    const { playChime, playLevelUp } = useAudio();
    const [connected, setConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const subscriptionsRef = useRef<Set<string>>(new Set());

    // Serialize standard STOMP frame
    const serializeFrame = (command: string, headers: Record<string, string>, body = "") => {
        let frame = command + "\n";
        for (const [k, v] of Object.entries(headers)) {
            frame += `${k}:${v}\n`;
        }
        frame += "\n" + body + "\0";
        return frame;
    };

    // Parse incoming raw STOMP frame
    const parseFrame = (rawText: string) => {
        const lines = rawText.split("\n");
        const command = lines[0].trim();
        const headers: Record<string, string> = {};
        
        let i = 1;
        while (i < lines.length && lines[i].trim() !== "") {
            const headerLine = lines[i];
            const colonIdx = headerLine.indexOf(":");
            if (colonIdx !== -1) {
                const key = headerLine.substring(0, colonIdx).trim();
                const value = headerLine.substring(colonIdx + 1).trim();
                headers[key] = value;
            }
            i++;
        }

        // The remaining lines contain the body (excluding leading empty line and ending null char)
        const bodyLines = lines.slice(i + 1);
        let body = bodyLines.join("\n").trim();
        if (body.endsWith("\0")) {
            body = body.substring(0, body.length - 1).trim();
        }

        return { command, headers, body };
    };

    const connect = () => {
        if (!user || socketRef.current) return;

        // Spring Boot WS endpoint (WS endpoint is not protected by standard HTTP filter, SockJS is mapped)
        let wsUrl = process.env.NEXT_PUBLIC_WS_BASE_URL;
        if (!wsUrl) {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
            if (apiBase) {
                wsUrl = apiBase.replace(/^http/, "ws") + "/ws/websocket";
            } else {
                const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
                wsUrl = `ws://${hostname}:8080/ws/websocket`;
            }
        }
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("WebSocket connected. Sending STOMP CONNECT frame...");
            const connectFrame = serializeFrame("CONNECT", {
                "accept-version": "1.1,1.2",
                "heart-beat": "10000,10000"
            });
            socket.send(connectFrame);
        };

        socket.onmessage = (event) => {
            const rawData = event.data;
            if (typeof rawData !== "string") return;

            const frame = parseFrame(rawData);

            if (frame.command === "CONNECTED") {
                console.log("STOMP connected successfully!");
                setConnected(true);
                
                // Subscribe to user private channel /topic/partner/{userId}
                const subDest = `/topic/partner/${user.id}`;
                const subFrame = serializeFrame("SUBSCRIBE", {
                    id: "sub-partner",
                    destination: subDest
                });
                socket.send(subFrame);
                subscriptionsRef.current.add(subDest);
            } 
            else if (frame.command === "MESSAGE") {
                try {
                    const msg: WebSocketMessage = JSON.parse(frame.body);
                    console.log("WebSocket message received: ", msg);
                    
                    // Handle live triggers
                    if (msg.type === "STAR_RECEIVED") {
                        if (msg.totalStars !== undefined) {
                            updateUser({
                                stars: msg.totalStars,
                                dragonLevel: msg.dragonLevel
                            });
                        }
                        if (msg.leveledUp) {
                            playLevelUp();
                        } else {
                            playChime();
                        }
                    }
                    else if (msg.type === "PARTNER_ENCOURAGEMENT") {
                        // Play a light cute chime
                        playChime();
                    }
                    else if (msg.type === "PARTNER_CONNECTED") {
                        // Map partner status in profile
                        updateUser({
                            partnerId: msg.partnerId ?? null
                        });
                    }

                    // Expose notification to UI toaster
                    setLastMessage(msg);
                } catch (e) {
                    console.error("Failed to parse STOMP message body: ", e);
                }
            }
        };

        socket.onclose = () => {
            console.log("WebSocket closed. Attempting reconnect...");
            setConnected(false);
            socketRef.current = null;
            subscriptionsRef.current.clear();
            
            // Retry connection in 4 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 4000);
        };

        socket.onerror = (err) => {
            console.error("WebSocket error: ", err);
            socket.close();
        };
    };

    const disconnect = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (socketRef.current) {
            const socket = socketRef.current;
            socketRef.current = null;
            if (socket.readyState === WebSocket.OPEN) {
                // Send standard DISCONNECT frame
                socket.send(serializeFrame("DISCONNECT", {}));
            }
            socket.close();
        }
        setConnected(false);
        subscriptionsRef.current.clear();
    };

    // Connect WebSocket when user is authenticated, and close on logout
    useEffect(() => {
        if (user) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [user, token]);

    const sendEncouragement = (msg: string) => {
        if (!user || !user.partnerId || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
        
        // Encourage REST API or directly over socket. For reliability and database tracking, 
        // we use our API wrapper in UI, but WebSocket exposes connection status.
    };

    const awardStarToPartner = (taskId: number | null, note: string) => {
        // Can be managed via API, WebSocket handles reactive triggers
    };

    const clearLastMessage = () => {
        setLastMessage(null);
    };

    return (
        <WebSocketContext.Provider
            value={{
                connected,
                lastMessage,
                clearLastMessage,
                sendEncouragement,
                awardStarToPartner
            }}
        >
            {children}

            {/* Float notification alerts / toast alert popups */}
            {lastMessage && (
                <div className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 animate-bounce items-center gap-3 rounded-2xl border-4 border-amber-300 bg-white p-4 shadow-xl select-none max-w-sm w-full md:max-w-md">
                    <span className="text-3xl">✨</span>
                    <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-sm">
                            {lastMessage.type === "STAR_RECEIVED" && "🎉 Magical Star Received!"}
                            {lastMessage.type === "PARTNER_TASK_COMPLETED" && "🔥 Partner Finished Task!"}
                            {lastMessage.type === "PARTNER_ENCOURAGEMENT" && "🎈 Encouragement Bubble!"}
                            {lastMessage.type === "PARTNER_CONNECTED" && "🤝 Accountability Bond Formed!"}
                            {lastMessage.type === "ACHIEVEMENT_EARNED" && "🏆 Trainer Badge Unlocked!"}
                        </h4>
                        <p className="text-xs text-slate-600 font-bold mt-0.5">
                            {lastMessage.type === "STAR_RECEIVED" && 
                                `Your partner ${lastMessage.senderNickname || "Companion"} sent a star! "${lastMessage.message}"`}
                            {lastMessage.type === "PARTNER_TASK_COMPLETED" && 
                                `Your partner ${lastMessage.partnerNickname} completed "${lastMessage.taskTitle}"! Award them a star!`}
                            {lastMessage.type === "PARTNER_ENCOURAGEMENT" && 
                                `"${lastMessage.message}" — sent by ${lastMessage.senderNickname || "Partner"}`}
                            {lastMessage.type === "PARTNER_CONNECTED" && 
                                `You are now linked with ${lastMessage.partnerNickname}! Let's reach our goals together.`}
                            {lastMessage.type === "ACHIEVEMENT_EARNED" && 
                                `Congratulations! You unlocked the "${lastMessage.name}" badge: ${lastMessage.description}!`}
                        </p>
                    </div>
                    <button
                        onClick={clearLastMessage}
                        className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-extrabold flex items-center justify-center text-xs"
                    >
                        ✕
                    </button>
                </div>
            )}
        </WebSocketContext.Provider>
    );
};
