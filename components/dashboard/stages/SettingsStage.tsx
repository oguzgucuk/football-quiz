"use client";

import React, { useState } from "react";
import {
  Settings,
  Volume2,
  VolumeX,
  Bell,
  Globe,
  Shield,
  LogOut,
  User,
  Check,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function SettingsStage() {
  const { user, logout } = useAuth();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stadiumAmbience, setStadiumAmbience] = useState(true);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto bg-transparent text-white select-none font-sans p-8 lg:p-12 h-full custom-scrollbar">
      {/* Arka Plan Radyal Vurgusu */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(34,197,94,0.1)_0%,rgba(10,18,14,0)_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-4xl mx-auto w-full space-y-6">
        {/* Başlık */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
              <Settings className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Oyun & Hesap Ayarları
              </h1>
              <p className="text-xs text-zinc-400">
                Ses, arayüz, gizlilik ve eşleşme tercihlerini yönet
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#15803d] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-900/40 hover:bg-[#126d34] active:scale-95 transition-all cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="size-4 stroke-[3]" />
                <span>Kaydedildi!</span>
              </>
            ) : (
              "Değişiklikleri Kaydet"
            )}
          </button>
        </div>

        {/* 1. Ses ve Atmosfer Ayarları */}
        <div className="rounded-[24px] bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Volume2 className="size-4 text-emerald-400" />
            <span>Ses ve Atmosfer</span>
          </h2>

          <div className="divide-y divide-white/10">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-sm text-white">Oyun İçi Ses Efektleri</p>
                <p className="text-xs text-zinc-400">Doğru cevap zili, hata sesi ve süre bitim uyarısı</p>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  soundEnabled ? "bg-[#15803d]" : "bg-white/15"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    soundEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-sm text-white">Stadyum Tezahürat Ambiyansı</p>
                <p className="text-xs text-zinc-400">Maç başladığında hafif arka plan stadyum uğultusu</p>
              </div>
              <button
                type="button"
                onClick={() => setStadiumAmbience(!stadiumAmbience)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  stadiumAmbience ? "bg-[#15803d]" : "bg-white/15"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    stadiumAmbience ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Oynanış ve Arayüz Tercihleri */}
        <div className="rounded-[24px] bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 p-6 shadow-xl space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Smartphone className="size-4 text-emerald-400" />
            <span>Oynanış ve Arayüz</span>
          </h2>

          <div className="divide-y divide-white/10">
            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-sm text-white">Otomatik Tamamlama (Fuse.js Asistanı)</p>
                <p className="text-xs text-zinc-400">İsim yazarken tarafsız futbolcu arama önerileri açılsın</p>
              </div>
              <button
                type="button"
                onClick={() => setSuggestionsEnabled(!suggestionsEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  suggestionsEnabled ? "bg-[#15803d]" : "bg-white/15"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    suggestionsEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-sm text-white">Herkese Açık Profil & ELO</p>
                <p className="text-xs text-zinc-400">Diğer oyuncular liderlik tablosunda profilini görebilsin</p>
              </div>
              <button
                type="button"
                onClick={() => setPublicProfile(!publicProfile)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  publicProfile ? "bg-[#15803d]" : "bg-white/15"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    publicProfile ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Hesap ve Oturum */}
        <div className="rounded-[24px] bg-[#0c1612]/80 backdrop-blur-xl border border-white/10 p-6 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-400">
              <LogOut className="size-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-white">Oturumu Kapat</p>
              <p className="text-xs text-zinc-400">
                Mevcut cihazdaki aktif oturumunuzu sonlandırın
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-950/60 text-rose-300 text-xs font-black uppercase tracking-wider hover:bg-rose-900/70 transition-all cursor-pointer"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
