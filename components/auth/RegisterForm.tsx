"use client";

import React, { useState } from "react";
import { Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";

interface RegisterFormProps {
  onSuccess?: () => void;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSuccess, onClose, onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !email.trim() || !password || isSubmitting) return;

    if (!/^[a-zA-Z0-9]+$/.test(cleanUsername)) {
      setErrorMsg("Kullanıcı adı yalnızca harf ve rakam içerebilir (boşluk veya özel karakter olamaz).");
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      setErrorMsg("Kullanıcı adı 3 ile 20 karakter arasında olmalıdır.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await register(cleanUsername, email.trim(), password);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Kayıt işlemi başarısız.";
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-300 animate-in fade-in duration-150">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span className="leading-tight">{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
          Kullanıcı Adı
        </label>
        <Input
          type="text"
          required
          maxLength={20}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Yalnızca harf ve rakam (örn: ahmet10)"
          autoComplete="username"
        />
        <span className="text-[10px] text-zinc-500 block mt-1">
          Özel karakter ve boşluk içeremez (3-20 karakter).
        </span>
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
          E-posta Adresi
        </label>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@mail.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
          Şifre
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="En az 6 karakter"
            autoComplete="new-password"
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
        disabled={isSubmitting || !username.trim() || !email.trim() || password.length < 6}
        className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-950/50 hover:shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin text-white" />
            <span>Kayıt Yapılıyor...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" />
            <span>Hesap Oluştur</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-zinc-400 pt-1">
        Zaten bir hesabın var mı?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
        >
          Giriş Yap
        </button>
      </p>
    </form>
  );
}
