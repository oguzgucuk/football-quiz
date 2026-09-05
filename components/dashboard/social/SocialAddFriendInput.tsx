"use client";

import React, { useState } from "react";
import { UserPlus } from "lucide-react";

interface SocialAddFriendInputProps {
  onAddFriend: (username: string) => Promise<string>;
}

export function SocialAddFriendInput({ onAddFriend }: SocialAddFriendInputProps) {
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = input.trim();
    if (!cleanUsername || isSubmitting) return;

    if (!/^[a-zA-Z0-9]+$/.test(cleanUsername)) {
      setActionFeedback({
        message: "Kullanıcı adı sadece harf ve rakam içerebilir.",
        isError: true,
      });
      setTimeout(() => setActionFeedback(null), 3500);
      return;
    }

    setIsSubmitting(true);
    try {
      const msg = await onAddFriend(cleanUsername);
      setActionFeedback({ message: msg, isError: false });
      setInput("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "İstek gönderilemedi.";
      setActionFeedback({ message: msg, isError: true });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  return (
    <div className="px-3.5 py-2.5 border-b border-white/10 bg-white/5 backdrop-blur-xs">
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Kullanıcı adı yaz..."
          maxLength={20}
          className="flex-1 bg-black/40 border border-white/15 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={isSubmitting || !input.trim()}
          className="px-3 py-1.5 rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0 cursor-pointer shadow-2xs"
          title="Arkadaş Ekle"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Ekle</span>
        </button>
      </form>

      {actionFeedback && (
        <div
          className={`mt-2 px-2 py-1.5 rounded-lg text-xs text-center border animate-in fade-in duration-200 ${
            actionFeedback.isError
              ? "bg-rose-950/60 border-rose-500/40 text-rose-300"
              : "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
          }`}
        >
          {actionFeedback.message}
        </div>
      )}
    </div>
  );
}
