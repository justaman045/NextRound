"use client";

import { useAuth } from "@/context/AuthContext";
import { ArrowRight, FileText, Triangle } from "lucide-react";
import Link from "next/link";
import Hero from "@/components/landing/Hero";
import ProductShowcase from "@/components/landing/ProductShowcase";
import BentoGrid from "@/components/landing/BentoGrid";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";

import { getSystemConfig } from "@/lib/firestore";
import { useEffect, useState } from "react";

export default function Home() {
  const { user, signInWithGoogle, logout } = useAuth();
  const [systemMode, setSystemMode] = useState<"development" | "production">("production");

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await getSystemConfig();
      if (config?.mode) setSystemMode(config.mode);
    };
    fetchConfig();
  }, []);

  return (
    <div className="min-h-screen text-white selection:bg-purple-500 selection:text-white font-sans overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black/50 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg shadow-white/10">
              <Triangle className="w-4 h-4 text-black fill-current" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                NextRound
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-white/10 text-purple-200 px-2 py-0.5 rounded-full border border-white/5">
                Beta
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400 hidden sm:block">Welcome, {user.displayName?.split(' ')[0]}</span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Logout
                </button>
                <Link
                  href="/profile"
                  className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                >
                  Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              systemMode === "production" && (
                <button
                  onClick={signInWithGoogle}
                  className="glass-button px-5 py-2 rounded-full font-medium transition-all text-sm"
                >
                  Sign In
                </button>
              )
            )}
          </div>
        </div>
      </nav>

      <Hero />
      <ProductShowcase />
      <BentoGrid />
      <Pricing />
      <FAQ />

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/80 backdrop-blur-lg py-12">
        <div className="max-w-7xl mx-auto px-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
            <Triangle className="w-5 h-5 fill-current" />
            <span className="font-bold">NextRound</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
            <Link href="/terms" className="hover:text-purple-400 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link>
          </div>

          <div className="text-gray-500 text-sm">
            <p className="mt-1">© 2026 NextRound. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
