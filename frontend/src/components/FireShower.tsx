"use client";

import React, { useEffect, useRef } from "react";

interface FireShowerProps {
    active: boolean;
    onComplete?: () => void;
    originId?: string;
    themeColor?: "ruby" | "emerald" | "sapphire" | string;
}

interface FireParticle {
    x: number;
    y: number;
    size: number;
    maxSize: number;
    color: string;
    glowColor: string;
    vx: number;
    vy: number;
    alpha: number;
    life: number; // 0 to 1
    decay: number;
    type: "flame" | "ember" | "smoke" | "spark";
    angle: number;
    angularVelocity: number;
    wobbleSpeed: number;
    wobbleRange: number;
    wobblePhase: number;
}

export const FireShower: React.FC<FireShowerProps> = ({
    active,
    onComplete,
    originId = "dragon-mascot-container",
    themeColor = "ruby"
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set screen size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Get origin point (the mascot's position)
        const getOrigin = () => {
            const el = document.getElementById(originId);
            if (el) {
                const rect = el.getBoundingClientRect();
                return {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2 - 10 // slightly higher (near mouth)
                };
            }
            // Fallback to center-bottom of screen if mascot not found
            return {
                x: canvas.width * 0.75, // dashboard mascot is usually on the right side
                y: canvas.height * 0.4
            };
        };

        const origin = getOrigin();

        // Theme colors mapping
        // The default mascot in the picture is Pink/Purple. 
        // We'll generate magical pink/purple fire by default, or match the user's avatar color theme.
        let flameColors: { base: string; glow: string }[] = [];
        const avatarLower = themeColor.toLowerCase();
        
        if (avatarLower === "ruby" || avatarLower === "pink" || avatarLower === "red") {
            // Purple, Pink, Magenta, Ruby Fire (matching the user's screenshot)
            flameColors = [
                { base: "#ec4899", glow: "rgba(236, 72, 153, 0.6)" }, // Pink
                { base: "#d946ef", glow: "rgba(217, 70, 239, 0.6)" }, // Magenta
                { base: "#a855f7", glow: "rgba(168, 85, 247, 0.6)" }, // Purple
                { base: "#e11d48", glow: "rgba(225, 29, 72, 0.6)" },  // Rose
                { base: "#f43f5e", glow: "rgba(244, 63, 94, 0.6)" },  // Light Rose
                { base: "#ffffff", glow: "rgba(255, 255, 255, 0.8)" }  // White hot core
            ];
        } else if (avatarLower === "emerald" || avatarLower === "green") {
            // Emerald, Mint, Turquoise Magical Fire
            flameColors = [
                { base: "#10b981", glow: "rgba(16, 185, 129, 0.6)" }, // Emerald
                { base: "#06b6d4", glow: "rgba(6, 182, 212, 0.6)" },  // Cyan
                { base: "#34d399", glow: "rgba(52, 211, 153, 0.6)" },  // Light Emerald
                { base: "#14b8a6", glow: "rgba(20, 184, 166, 0.6)" },  // Teal
                { base: "#a7f3d0", glow: "rgba(167, 243, 208, 0.6)" }, // Mint
                { base: "#ffffff", glow: "rgba(255, 255, 255, 0.8)" }
            ];
        } else if (avatarLower === "sapphire" || avatarLower === "blue") {
            // Sapphire, Indigo, Cobalt Fire
            flameColors = [
                { base: "#3b82f6", glow: "rgba(59, 130, 246, 0.6)" }, // Blue
                { base: "#6366f1", glow: "rgba(99, 102, 241, 0.6)" }, // Indigo
                { base: "#8b5cf6", glow: "rgba(139, 92, 246, 0.6)" }, // Violet
                { base: "#06b6d4", glow: "rgba(6, 182, 212, 0.6)" },  // Cyan
                { base: "#93c5fd", glow: "rgba(147, 197, 253, 0.6)" }, // Light Blue
                { base: "#ffffff", glow: "rgba(255, 255, 255, 0.8)" }
            ];
        } else {
            // Classic Golden/Orange Dragon Fire
            flameColors = [
                { base: "#f97316", glow: "rgba(249, 115, 22, 0.6)" }, // Orange
                { base: "#ef4444", glow: "rgba(239, 68, 68, 0.6)" },  // Red
                { base: "#eab308", glow: "rgba(234, 179, 8, 0.6)" },  // Yellow
                { base: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)" }, // Amber
                { base: "#ffedd5", glow: "rgba(255, 237, 213, 0.8)" }, // Warm White
                { base: "#ffffff", glow: "rgba(255, 255, 255, 0.8)" }
            ];
        }

        const particles: FireParticle[] = [];
        
        // Configuration
        const duration = 2800; // 2.8 seconds total
        const startTime = Date.now();

        // Let's create an initial massive blast, followed by a continuous steam of fire
        const createBlast = (count: number) => {
            const currentOrigin = getOrigin();
            for (let i = 0; i < count; i++) {
                // Shoot in all directions to fill the screen
                const angle = Math.random() * Math.PI * 2;
                // High velocity to reach screen edges
                const speed = 5 + Math.random() * 22;
                const size = 10 + Math.random() * 25;
                const life = 1.0;
                // Random decay
                const decay = 0.008 + Math.random() * 0.015;
                
                // Categorize particles
                const typeRand = Math.random();
                let type: "flame" | "ember" | "smoke" | "spark" = "flame";
                if (typeRand < 0.4) type = "flame";
                else if (typeRand < 0.75) type = "ember";
                else if (typeRand < 0.9) type = "spark";
                else type = "smoke";

                const colorObj = flameColors[Math.floor(Math.random() * flameColors.length)];

                particles.push({
                    x: currentOrigin.x,
                    y: currentOrigin.y,
                    size,
                    maxSize: size * (1.2 + Math.random() * 0.8),
                    color: type === "smoke" ? "#312e81" : colorObj.base,
                    glowColor: colorObj.glow,
                    vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
                    vy: Math.sin(angle) * speed - (type === "flame" || type === "ember" ? 3 : 0), // natural lift
                    alpha: 1.0,
                    life,
                    decay,
                    type,
                    angle: Math.random() * Math.PI * 2,
                    angularVelocity: (Math.random() - 0.5) * 0.1,
                    wobbleSpeed: 0.02 + Math.random() * 0.08,
                    wobbleRange: 2 + Math.random() * 8,
                    wobblePhase: Math.random() * Math.PI * 2
                });
            }
        };

        // Create the initial big blast
        createBlast(150);

        // Keep emitting stream of fire from the dragon for the first 1.2 seconds
        let emitterInterval: NodeJS.Timeout;
        const startEmitter = () => {
            emitterInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                if (elapsed > 1200) {
                    clearInterval(emitterInterval);
                    return;
                }

                // Add 10-15 particles per tick
                const currentOrigin = getOrigin();
                const count = 12;
                for (let i = 0; i < count; i++) {
                    // Blow fire in a wide cone directed towards the left & upward/downward (since mascot is on the right)
                    // Angle between 110 deg and 250 deg (roughly pointing leftwards)
                    const angle = Math.PI + (Math.random() - 0.5) * 1.5; // Leftwards cone
                    const speed = 4 + Math.random() * 15;
                    const size = 8 + Math.random() * 20;
                    const decay = 0.01 + Math.random() * 0.02;

                    const typeRand = Math.random();
                    let type: "flame" | "ember" | "smoke" | "spark" = "flame";
                    if (typeRand < 0.5) type = "flame";
                    else if (typeRand < 0.8) type = "ember";
                    else type = "spark";

                    const colorObj = flameColors[Math.floor(Math.random() * flameColors.length)];

                    particles.push({
                        x: currentOrigin.x - 20, // slightly left of center
                        y: currentOrigin.y,
                        size,
                        maxSize: size * (1.1 + Math.random() * 0.6),
                        color: colorObj.base,
                        glowColor: colorObj.glow,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 1.5,
                        alpha: 1.0,
                        life: 1.0,
                        decay,
                        type,
                        angle: Math.random() * Math.PI * 2,
                        angularVelocity: (Math.random() - 0.5) * 0.1,
                        wobbleSpeed: 0.03 + Math.random() * 0.06,
                        wobbleRange: 3 + Math.random() * 5,
                        wobblePhase: Math.random() * Math.PI * 2
                    });
                }
            }, 50);
        };
        startEmitter();

        const drawFlameShape = (c: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number, alpha: number) => {
            c.save();
            c.translate(x, y);
            c.rotate(angle);
            
            c.beginPath();
            // Create a teardrop/flame path
            c.moveTo(0, -r * 1.5);
            c.bezierCurveTo(r * 0.8, -r * 0.5, r * 1.2, r * 0.5, 0, r * 1.3);
            c.bezierCurveTo(-r * 1.2, r * 0.5, -r * 0.8, -r * 0.5, 0, -r * 1.5);
            c.closePath();
            c.fill();
            c.restore();
        };

        const render = () => {
            const elapsed = Date.now() - startTime;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Subtle full-screen heat pulse
            if (elapsed < 1500) {
                const pulseAlpha = Math.max(0, 0.18 * (1 - elapsed / 1500));
                // Gradient pulse centered around the dragon mouth
                const curOrigin = getOrigin();
                const radialGlow = ctx.createRadialGradient(
                    curOrigin.x, curOrigin.y, 50,
                    curOrigin.x, curOrigin.y, canvas.width * 0.9
                );
                
                let glowRGB = "236, 72, 153"; // Default Pink
                if (avatarLower === "emerald" || avatarLower === "green") glowRGB = "16, 185, 129";
                else if (avatarLower === "sapphire" || avatarLower === "blue") glowRGB = "59, 130, 246";
                else if (avatarLower !== "ruby" && avatarLower !== "pink" && avatarLower !== "red") glowRGB = "249, 115, 22"; // Classic Orange
                
                radialGlow.addColorStop(0, `rgba(${glowRGB}, ${pulseAlpha * 1.5})`);
                radialGlow.addColorStop(0.3, `rgba(${glowRGB}, ${pulseAlpha})`);
                radialGlow.addColorStop(1, "rgba(0,0,0,0)");
                
                ctx.fillStyle = radialGlow;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            let aliveCount = 0;

            particles.forEach((p) => {
                if (p.life <= 0) return;
                aliveCount++;

                ctx.save();
                
                // Add soft fire glow to active sparks and flames
                if (p.type === "flame" || p.type === "ember") {
                    ctx.shadowBlur = p.size * 0.8;
                    ctx.shadowColor = p.glowColor;
                }

                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;

                // Render based on particle type
                if (p.type === "flame") {
                    drawFlameShape(ctx, p.x, p.y, p.size, p.angle, p.alpha);
                } else if (p.type === "ember") {
                    // Small bright sparks
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === "spark") {
                    // Fast lines shooting out
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = p.size * 0.25;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    // Draw line opposite to velocity vector
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                    if (speed > 0.1) {
                        ctx.lineTo(p.x - (p.vx / speed) * p.size * 1.8, p.y - (p.vy / speed) * p.size * 1.8);
                    } else {
                        ctx.lineTo(p.x, p.y + p.size);
                    }
                    ctx.stroke();
                } else if (p.type === "smoke") {
                    // Expand and fade smoke
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();

                // Apply physics & forces
                p.x += p.vx;
                p.y += p.vy;

                // Apply simple turbulence/wobble
                p.wobblePhase += p.wobbleSpeed;
                p.x += Math.sin(p.wobblePhase) * p.wobbleRange * 0.08;

                // Fire physics
                if (p.type === "flame" || p.type === "smoke") {
                    // Upward thermal force
                    p.vy -= 0.18;
                    // Friction/Drag
                    p.vx *= 0.96;
                    p.vy *= 0.96;
                    // Growth & shrinkage
                    if (p.life > 0.5) {
                        // Expand initially
                        p.size += (p.maxSize - p.size) * 0.1;
                    } else {
                        // Shrink to zero
                        p.size *= 0.94;
                    }
                } else if (p.type === "ember" || p.type === "spark") {
                    // Drifting embers (affected by gravity slightly less, float up)
                    p.vy -= 0.05;
                    p.vx *= 0.98;
                    p.vy *= 0.98;
                    p.size *= 0.97; // slow shrinking
                }

                // Rotational spin
                p.angle += p.angularVelocity;

                // Life decay
                p.life -= p.decay;
                
                // Fade out near end of life
                p.alpha = Math.min(1.0, p.life * 2.0);
            });

            // Continue animation loop if time isn't up and particles are still alive
            if (elapsed < duration && aliveCount > 0) {
                animationFrameRef.current = requestAnimationFrame(render);
            } else {
                if (onComplete) onComplete();
            }
        };

        render();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            clearInterval(emitterInterval);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [active, onComplete, originId, themeColor]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-50 h-full w-full"
            style={{ mixBlendMode: "screen" }}
        />
    );
};
