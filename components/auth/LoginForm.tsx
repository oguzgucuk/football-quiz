"use client";

import React, { useState } from "react";
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
  onSuccess?: () => void;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSuccess, onClose, onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password || isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(identifier.trim(), password);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Giriş başarısız.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span className="leading-tight">{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
          Kullanıcı Adı veya E-posta
        </label>
        <Input
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="ornek_kullanici"
          autoComplete="username"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
          Şifre
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !identifier.trim() || !password}
        className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin text-white" />
            <span>Giriş Yapılıyor...</span>
          </>
        ) : (
          <>
            <LogIn className="size-4" />
            <span>Giriş Yap</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-zinc-400 pt-1">
        Hesabın yok mu?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
        >
          Hemen Kayıt Ol
        </button>
      </p>
    </form>
  );
}
