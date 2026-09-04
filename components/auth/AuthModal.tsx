"use client";

import React, { useState, useEffect } from "react";
import { X, Trophy, Eye, EyeOff, UserPlus, LogIn, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form alanları
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // initialTab değiştiğinde sekme senkronizasyonu
  useEffect(() => {
    setActiveTab(initialTab);
    setErrorMsg(null);
  }, [initialTab, isOpen]);

  // Escape tuşuyla kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword || isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(loginIdentifier.trim(), loginPassword);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Giriş başarısız.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = registerUsername.trim();
    if (!cleanUsername || !registerEmail.trim() || !registerPassword || isSubmitting) return;

    // Alfanümerik kullanıcı adı kuralı
    if (!/^[a-zA-Z0-9]+$/.test(cleanUsername)) {
      setErrorMsg("Kullanıcı adı yalnızca harf ve rakam içerebilir (boşluk veya özel karakter olamaz).");
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      setErrorMsg("Kullanıcı adı 3 ile 20 karakter arasında olmalıdır.");
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMsg("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await register(cleanUsername, registerEmail.trim(), registerPassword);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Kayıt işlemi başarısız.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Modal Kutusu */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-zinc-800/80 bg-[#0B101B]/95 text-zinc-100 p-7 shadow-2xl backdrop-blur-xl transition-all select-none"
      >
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-white transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Başlık ve Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <Trophy className="size-6" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Futbol<span className="text-emerald-400">Quiz</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {activeTab === "login"
              ? "Dereceli maçlara girmek, ELO ve arkadaş listeni görmek için giriş yap."
              : "Ücretsiz hesabını aç, rekabetçi ligde yerini al!"}
          </p>
        </div>

        {/* Sekme Geçişi */}
        <div className="flex rounded-xl bg-zinc-900/80 p-1 border border-zinc-800/60 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMsg(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "login"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LogIn className="size-3.5" />
            <span>Giriş Yap</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setErrorMsg(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "register"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserPlus className="size-3.5" />
            <span>Kayıt Ol</span>
          </button>
        </div>

        {/* Hata Bildirimi */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
            <AlertCircle className="size-4 shrink-0 text-rose-400" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Form İçeriği */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Kullanıcı Adı veya E-posta
              </label>
              <input
                type="text"
                required
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder="ornek_kullanici"
                className="w-full bg-[#080C14] border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#080C14] border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !loginIdentifier.trim() || !loginPassword}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <LogIn className="size-4" />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-zinc-500 pt-1">
              Hesabın yok mu?{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMsg(null);
                }}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Hemen Kayıt Ol
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                placeholder="Yalnızca harf ve rakam (örn: ahmet10)"
                className="w-full bg-[#080C14] border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
              />
              <span className="text-[10px] text-zinc-500 block mt-1">
                Özel karakter ve boşluk içeremez (3-20 karakter).
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                E-posta Adresi
              </label>
              <input
                type="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full bg-[#080C14] border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full bg-[#080C14] border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 pr-10 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !registerUsername.trim() ||
                !registerEmail.trim() ||
                registerPassword.length < 6
              }
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Kayıt Yapılıyor...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  <span>Hesap Oluştur</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-zinc-500 pt-1">
              Zaten bir hesabın var mı?{" "}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                }}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Giriş Yap
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
