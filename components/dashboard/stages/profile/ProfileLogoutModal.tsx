"use client";

import React from "react";
import { LogOut } from "lucide-react";

interface ProfileLogoutModalProps {
  isOpen: boolean;
  isLoggingOut: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export function ProfileLogoutModal({
  isOpen,
  isLoggingOut,
  onClose,
  onConfirmLogout,
}: ProfileLogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#0d1611]/95 border border-white/15 p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-xs">
            <LogOut className="size-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-white tracking-tight">
              Çıkış Yapmak İstiyor musun?
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-medium leading-relaxed">
              Hesabından çıkış yaptığında oturumun sonlandırılır. Tekrar maç yapabilmek ve puanlarına erişmek için yeniden giriş yapman gerekecek.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={onConfirmLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs transition-all cursor-pointer shadow-sm hover:shadow-rose-600/25 disabled:opacity-60"
          >
            {isLoggingOut ? (
              <>
                <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Çıkış Yapılıyor...</span>
              </>
            ) : (
              <>
                <LogOut className="size-3.5" />
                <span>Evet, Çıkış Yap</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
