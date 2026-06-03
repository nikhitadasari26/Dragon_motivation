"use client";

import React, { useEffect, useRef } from "react";

interface ConfettiShowerProps {
    active: boolean;
    onComplete?: () => void;
}

interface Particle {
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
    type: "circle" | "ribbon" | "star" | "balloon";
    opacity: number;
}

export const ConfettiShower: React.FC<ConfettiShowerProps> = ({ active, onComplete }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Make canvas full screen
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const colors = [
            "#FF7A90", // Pastel Pink
            "#FFE359", // Magic Yellow
            "#4DDA96", // Emerald Green
            "#5DBCFC", // Sapphire Blue
            "#BE9AFA", // Ruby Violet
            "#FFA254"  // Balloon Orange
        ];

        const particles: Particle[] = [];
        const particleCount = 130;

        // Initialize particles in a volcanic burst from the center-bottom
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI - Math.PI; // upward burst
            const speed = 8 + Math.random() * 14;
            const size = 6 + Math.random() * 10;
            const typeRand = Math.random();
            let type: "circle" | "ribbon" | "star" | "balloon" = "circle";

            if (typeRand < 0.25) type = "star";
            else if (typeRand < 0.5) type = "ribbon";
            else if (typeRand < 0.65) type = "balloon";

            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 50,
                y: canvas.height - 20,
                size,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: Math.cos(angle) * speed + (Math.random() - 0.5) * 4,
                speedY: Math.sin(angle) * speed - 5, // strong upward vector
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                type,
                opacity: 1
            });
        }

        let frame = 0;
        const maxFrames = 150; // ~2.5 seconds at 60fps

        const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
            let rot = (Math.PI / 2) * 3;
            let x = cx;
            let y = cy;
            const step = Math.PI / spikes;

            c.stroke();
            c.beginPath();
            c.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                c.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                c.lineTo(x, y);
                rot += step;
            }
            c.lineTo(cx, cy - outerRadius);
            c.closePath();
            c.fill();
        };

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let activeParticles = 0;

            particles.forEach((p) => {
                if (p.opacity <= 0) return;
                activeParticles++;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;

                if (p.type === "circle") {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.type === "ribbon") {
                    ctx.fillRect(-p.size, -p.size / 3, p.size * 2, p.size / 1.5);
                } else if (p.type === "star") {
                    drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
                } else if (p.type === "balloon") {
                    // Draw a cute teardrop cartoon balloon
                    ctx.beginPath();
                    ctx.moveTo(0, -p.size);
                    ctx.quadraticCurveTo(p.size, -p.size, p.size, 0);
                    ctx.quadraticCurveTo(p.size, p.size, 0, p.size);
                    ctx.quadraticCurveTo(-p.size, p.size, -p.size, 0);
                    ctx.quadraticCurveTo(-p.size, -p.size, 0, -p.size);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Balloon basket thread
                    ctx.beginPath();
                    ctx.strokeStyle = "#8B5CF6";
                    ctx.lineWidth = 1;
                    ctx.moveTo(0, p.size);
                    ctx.lineTo(0, p.size + 6);
                    ctx.stroke();
                }

                ctx.restore();

                // Apply physics
                p.x += p.speedX;
                p.y += p.speedY;

                p.speedY += 0.35; // gravity pulling down
                p.speedX *= 0.98; // air resistance
                p.rotation += p.rotationSpeed;

                // Slowly fade out past 60% of animation
                if (frame > maxFrames * 0.5) {
                    p.opacity -= 0.02;
                }
            });

            frame++;

            if (frame < maxFrames && activeParticles > 0) {
                animationFrameRef.current = requestAnimationFrame(render);
            } else {
                if (onComplete) onComplete();
            }
        };

        render();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [active, onComplete]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-50 h-full w-full"
            style={{ mixBlendMode: "screen" }}
        />
    );
};
