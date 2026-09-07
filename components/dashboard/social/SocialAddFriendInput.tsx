"use client";

import React, { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

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
    <div className="px-3.5 py-2.5 border-b border-white/10 bg-black/20 backdrop-blur-xs">
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Kullanıcı adı yaz..."
          maxLength={20}
          className="h-9 text-xs"
        />
        <button
          type="submit"
          disabled={isSubmitting || !input.trim()}
          className="h-9 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0 cursor-pointer shadow-md shadow-emerald-950/50 border border-emerald-400/30 active:scale-95"
          title="Arkadaş Ekle"
        >
          {isSubmitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <UserPlus className="size-3.5" />
          )}
          <span>Ekle</span>
        </button>
      </form>

      {actionFeedback && (
        <div
          className={`mt-2 px-2.5 py-1.5 rounded-xl text-xs text-center border animate-in fade-in duration-200 ${
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
