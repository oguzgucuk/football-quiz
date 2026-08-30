"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Radio, Send, Activity, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

export default function TestPartyPage() {
  const [roomId, setRoomId] = useState("test-room");
  const [username, setUsername] = useState("Oyuncu_1");
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [serverState, setServerState] = useState<any>(null);

  useEffect(() => {
    setUsername(`Oyuncu_${Math.floor(100 + Math.random() * 900)}`);
  }, []);

  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const host = window.location.hostname || "localhost";
    const wsUrl = `ws://${host}:1999/parties/game/${roomId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      console.log("[TestParty] WebSocket bağlantısı açıldı:", wsUrl);
      // Odaya katılım mesajı
      ws.send(JSON.stringify({ type: "PLAYER_JOIN", userId: `user_${username}`, username }));
      // Ping testi
      sendPing(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[TestParty] Gelen mesaj:", data);

        if (data.type === "PONG") {
          const roundTrip = Date.now() - data.clientTimestamp;
          setLatency(roundTrip);
        } else if (data.type === "CHAT_MESSAGE") {
          setChatMessages((prev) => [...prev, { sender: data.sender, text: data.text, timestamp: data.timestamp }]);
        } else if (data.type === "ROOM_STATE_SYNC") {
          setServerState(data.state);
        }
      } catch (err) {
        console.error("[TestParty] Mesaj parse hatası:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setLatency(null);
      console.log("[TestParty] WebSocket bağlantısı kapandı.");
    };

    ws.onerror = (err) => {
      console.error("[TestParty] WebSocket hatası:", err);
      setIsConnected(false);
    };

    wsRef.current = ws;
  };

  const sendPing = (wsInstance?: WebSocket) => {
    const ws = wsInstance || wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "PING", timestamp: Date.now() }));
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: "CHAT",
        sender: username,
        text: inputMessage.trim(),
      })
    );

    setInputMessage("");
  };

  useEffect(() => {
    connect();
    const interval = setInterval(() => {
      sendPing();
    }, 5000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [roomId]);

  return (
    <main className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full flex flex-col gap-6">
        {/* Başlık */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Adım 1: PartyKit / WebSocket Sanity Check
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Canlı Bağlantı & Mesaj Testi</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Bu sayfayı iki ayrı sekmede açarak anlık mesajlaşma ve gecikme (latency) testini doğrulayabilirsiniz.
          </p>
        </div>

        {/* Durum Kartı */}
        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full ${
                isConnected ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-rose-500 animate-ping"
              }`}
            />
            <div>
              <div className="text-sm font-bold text-white">
                {isConnected ? "Sunucuya Bağlı" : "Bağlantı Kurulamadı"}
              </div>
              <div className="text-xs text-zinc-500">Oda: {roomId}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {latency !== null && (
              <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
                <Activity className="w-3.5 h-3.5" />
                {latency} ms
              </div>
            )}
            <Button size="sm" variant="outline" onClick={() => sendPing()}>
              Ping Gönder
            </Button>
          </div>
        </Card>

        {/* Mesajlaşma Kartı */}
        <Card variant="glass" className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Canlı Mesaj Alışverişi
            </div>
            <div className="text-xs text-zinc-400">
              Kullanıcı Adın: <span className="text-emerald-400 font-semibold">{username}</span>
            </div>
          </div>

          {/* Mesaj Listesi */}
          <div className="h-48 overflow-y-auto flex flex-col gap-2 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 font-sans text-sm">
            {chatMessages.length === 0 ? (
              <div className="m-auto text-xs text-zinc-600">Henüz mesaj yok. Aşağıdan bir mesaj gönderin.</div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[80%] rounded-xl px-3 py-2 ${
                    msg.sender === username
                      ? "ml-auto bg-emerald-500/20 border border-emerald-500/30 text-emerald-200"
                      : "mr-auto bg-zinc-800/60 border border-zinc-700/50 text-zinc-200"
                  }`}
                >
                  <span className="text-[10px] text-zinc-400 font-semibold">{msg.sender}</span>
                  <span className="text-sm">{msg.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Mesaj Giriş Formu */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Örn: Merhaba, iki sekme de çalışıyor mu?"
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
            />
            <Button type="submit" size="md">
              <Send className="w-4 h-4" />
              Gönder
            </Button>
          </form>
        </Card>

        {/* Sunucu State Önizlemesi */}
        {serverState && (
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400">
            <div className="font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Sunucudan Gelen Senkron Oda Durumu (RoomState):
            </div>
            <div>Durum: <span className="text-emerald-400">{serverState.status}</span></div>
            <div>Tur Durumu: <span className="text-cyan-400">{serverState.roundStatus}</span></div>
            <div>Maksimum Tur: <span className="text-amber-400">{serverState.maxRounds}</span></div>
          </div>
        )}
      </div>
    </main>
  );
}
