"use client";

import React, { useState, useEffect } from "react";
import { Trophy, LogIn, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: "login" | "register";
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  initialTab = "login",
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-[#0c1612]/95 p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-zinc-100 select-none">
        {/* Üst Başlık & Marka */}
        <DialogHeader className="flex flex-col items-center text-center space-y-2">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Trophy className="size-6 text-emerald-400" />
          </div>
          <DialogTitle className="text-xl font-black tracking-tight text-white">
            Futbol<span className="text-emerald-400">Quiz</span> Arena
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400 max-w-xs">
            {activeTab === "login"
              ? "Dereceli maçlara girmek, ELO ve arkadaş listeni görmek için giriş yap."
              : "Ücretsiz hesabını aç, stadyumda rekabete katıl!"}
          </DialogDescription>
        </DialogHeader>

        {/* Sekme Geçişi */}
        <div className="flex rounded-xl bg-black/40 p-1 border border-white/10 my-1">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "login"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LogIn className="size-3.5" />
            <span>Giriş Yap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "register"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserPlus className="size-3.5" />
            <span>Kayıt Ol</span>
          </button>
        </div>

        {/* Form Alanı */}
        <div className="pt-2">
          {activeTab === "login" ? (
            <LoginForm
              onSuccess={onSuccess}
              onClose={onClose}
              onSwitchToRegister={() => setActiveTab("register")}
            />
          ) : (
            <RegisterForm
              onSuccess={onSuccess}
              onClose={onClose}
              onSwitchToLogin={() => setActiveTab("login")}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
