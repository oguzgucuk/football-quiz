"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { Zap, UserPlus, LogIn, Shield, ArrowRight, AlertCircle, CheckCircle2, Trophy } from "lucide-react";

type AuthTab = "guest" | "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loginAsGuest, user } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>("guest");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State'leri
  const [guestUsername, setGuestUsername] = useState(() => `Oyuncu_${Math.floor(100 + Math.random() * 900)}`);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestUsername.trim() || isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await loginAsGuest(guestUsername.trim());
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Misafir girişi yapılamadı.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword || isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(loginIdentifier.trim(), loginPassword);
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Giriş başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername.trim() || !registerEmail.trim() || !registerPassword || isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await register(registerUsername.trim(), registerEmail.trim(), registerPassword);
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Kayıt işlemi başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Arka Plan Işık Efektleri */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full flex flex-col gap-6 relative z-10">
        {/* Üst Logo ve Başlık */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-200">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">Futbol Quiz 1v1</span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Oyuna Giriş Yap</h1>
          <p className="text-xs text-zinc-400 mt-1">
            İster tek tıkla misafir olarak oyna, ister hesap oluşturup ELO puanını kaydet!
          </p>
        </div>

        {/* Auth Kartı */}
        <Card variant="glass" className="p-6">
          {/* Tab Butonları */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("guest");
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "guest"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Hızlı Oyna
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "login"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Giriş Yap
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "register"
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Kayıt Ol
            </button>
          </div>

          {/* Hata Bildirimi */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: MİSAFİR GİRİŞİ */}
          {activeTab === "guest" && (
            <form onSubmit={handleGuestSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Kullanıcı Adı Seç
                </label>
                <input
                  type="text"
                  value={guestUsername}
                  onChange={(e) => setGuestUsername(e.target.value)}
                  placeholder="Örn: KralForvet"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Misafir olarak hızlıca oyuna girebilirsin.
                </span>
              </div>

              <Button type="submit" size="lg" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? "Giriş Yapılıyor..." : "Hemen Başla (Misafir)"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* TAB 2: GİRİŞ YAP */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Kullanıcı Adı veya E-posta
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="kullanici_adi veya ornek@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Parola
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <Button type="submit" size="lg" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? "Giriş Yapılıyor..." : "Giriş Yap"}
                <LogIn className="w-4 h-4" />
              </Button>
            </form>
          )}

          {/* TAB 3: KAYIT OL */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  placeholder="Örn: AlexDeSouza"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Parola (En az 6 karakter)
                </label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <Button type="submit" size="lg" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? "Hesap Oluşturuluyor..." : "Kayıt Ol & Başla"}
                <UserPlus className="w-4 h-4" />
              </Button>
            </form>
          )}
        </Card>

        {/* Güvenlik Notu */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Şifrelenmiş güvenli JWT oturumu</span>
        </div>
      </div>
    </main>
  );
}
