import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { AudioProvider } from "@/context/AudioContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Dragon Motivation — Gamified Daily Tasks & Accountability",
  description: "Supercharge your productivity, consistent focus, and emotional growth with a cute growing dragon pet, dynamic AI companion stories, and live accountability partners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full bg-gradient-to-b from-sky-50 to-indigo-50/30 text-slate-800 flex flex-col">
        <AuthProvider>
          <AudioProvider>
            <WebSocketProvider>
              {children}
            </WebSocketProvider>
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
