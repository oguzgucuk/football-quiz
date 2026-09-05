"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Wrench, User, LogIn, Swords } from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <header className="border-b border-white/10 bg-[#0c1612]/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Swords className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Futbol<span className="text-emerald-400">Quiz</span>
          </span>
        </Link>

        {/* Butonlar ve Kullanıcı Alanı */}
        <div className="flex items-center gap-3">
          <Link href="/sandbox">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hidden sm:inline-flex"
            >
              <Wrench className="w-3.5 h-3.5 mr-1" />
              Sandbox
            </Button>
          </Link>

          {isLoading ? (
            <div className="w-24 h-8 bg-white/5 rounded-lg animate-pulse" />
          ) : isAuthenticated && user ? (
            <Link href="/profile">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c1612] border border-white/10 hover:border-emerald-500/40 transition-colors cursor-pointer group">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors leading-none">
                    {user.username}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold mt-0.5">
                    {user.eloRating} ELO
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/?auth=login">
              <Button size="sm" variant="primary">
                <LogIn className="w-3.5 h-3.5 mr-1" />
                Giriş Yap
              </Button>
            </Link>
          )}

          <Badge variant="brand" className="hidden md:inline-flex">v0.1.0 MVP</Badge>
        </div>
      </div>
    </header>
  );
}
