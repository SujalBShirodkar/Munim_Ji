'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  canListen,
  canSpeak,
  speakText,
  startListening,
  stopSpeaking,
  warmSpeech,
  type ListenerHandle,
} from '@/lib/speech';
import {
  Send,
  Volume2,
  VolumeX,
  LineChart,
  ShoppingBag,
  WalletCards,
  ArrowRight,
  Mic,
  MicOff,
  ArrowLeft,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'munim';
  text: string;
  spokenText?: string;
  detectedLang?: 'hi' | 'en';
  uiActions?: any[];
}

const CHIPS = [
  'Kal ki bikri kitni thi?',
  'Chai ₹2 mehngi karu toh?',
  'Cheeni ka group order?',
  'Mujhe ₹5,000 chahiye',
];

export default function AskMunimPage() {
  const { lang } = useLanguage();
  const speakLang = lang === 'en' ? 'en' : 'hi';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'munim',
      text: 'Namaste Sharma ji! Kal ki bikri, daam badhana, ya cheeni ka order — poochhein.',
      spokenText:
        'Namaste Sharma ji! Kal ki bikri, daam badhana, ya cheeni ka order — poochhein.',
      detectedLang: 'hi',
    },
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [micHint, setMicHint] = useState('');
  const [voiceMode, setVoiceMode] = useState('Checking voice…');
  const endRef = useRef<HTMLDivElement>(null);
  const listenerRef = useRef<ListenerHandle | null>(null);

  useEffect(() => {
    warmSpeech();
    void api.getVoiceStatus()
      .then((s) => {
        const bits = [
          s.tts ? 'Cartesia voice' : 'Browser voice',
          s.stt ? 'Deepgram mic' : 'Browser mic',
          s.llm ? 'Groq brain' : 'Demo brain',
        ];
        setVoiceMode(bits.join(' · '));
      })
      .catch(() => setVoiceMode('Browser voice · type OK'));
    return () => {
      listenerRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking, transcript]);

  const speak = async (text: string, overrideLang?: 'hi' | 'en') => {
    if (!canSpeak() || !text.trim()) return;
    const targetLang = overrideLang || speakLang;
    await speakText(text, {
      lang: targetLang,
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const stopSpeak = () => {
    stopSpeaking();
    setSpeaking(false);
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || thinking) return;
    listenerRef.current?.stop();
    setListening(false);
    stopSpeak();
    setMessages((m) => [...m, { id: `u-${Date.now()}`, sender: 'user', text }]);
    setInput('');
    setTranscript('');
    setMicHint('');
    setThinking(true);
    try {
      const res = await api.sendChatMessage(text, lang);
      const reply = res.display_text || res.spoken_text || '…';
      const spoken = res.spoken_text || res.display_text;
      const audioLang: 'hi' | 'en' = res.detected_language === 'en' ? 'en' : 'hi';
      setMessages((m) => [
        ...m,
        {
          id: `m-${Date.now()}`,
          sender: 'munim',
          text: reply,
          spokenText: spoken,
          detectedLang: audioLang,
          uiActions: res.ui_actions || [],
        },
      ]);
      if (spoken) await speak(spoken, audioLang);
    } catch {
      const err =
        lang === 'en'
          ? 'Sorry — please try again.'
          : 'Maaf kijiye — phir se try karein.';
      setMessages((m) => [...m, { id: `e-${Date.now()}`, sender: 'munim', text: err }]);
    } finally {
      setThinking(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      listenerRef.current?.stop();
      listenerRef.current = null;
      setListening(false);
      return;
    }

    if (!canListen()) {
      setMicHint('Chrome ya Edge use karein for mic — ya type karein.');
      return;
    }

    setMicHint('');
    setTranscript('Listening…');
    listenerRef.current = startListening({
      lang: speakLang,
      onStart: () => setListening(true),
      onPartial: (t) => setTranscript(t),
      onFinal: (t) => {
        setListening(false);
        listenerRef.current = null;
        setTranscript(t);
        void send(t);
      },
      onError: (msg) => {
        setMicHint(msg);
        setListening(false);
        setTranscript('');
      },
      onEnd: () => setListening(false),
    });
  };

  const actionLink = (target: string) => {
    if (target === 'simulator')
      return { href: '/whatif', label: 'Open simulator', Icon: LineChart };
    if (target === 'pool') return { href: '/pool', label: 'View pool', Icon: ShoppingBag };
    if (target === 'credit')
      return { href: '/credit', label: 'View credit', Icon: WalletCards };
    return null;
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-8.5rem)]">
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1 text-slate-400 hover:text-slate-700">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-sm font-bold text-slate-900">Ask Munim Ji</p>
              <p className="text-[11px] text-slate-400">{voiceMode}</p>
            </div>
          </div>
          {speaking && (
            <button
              onClick={stopSpeak}
              className="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-800 flex items-center gap-1"
            >
              <VolumeX size={12} /> Mute
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[var(--paytm-navy)] text-white rounded-br-md'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-bl-md shadow-sm'
                }`}
              >
                {m.sender === 'munim' && m.spokenText && canSpeak() && (
                  <button
                    onClick={() => void speak(m.spokenText!, m.detectedLang)}
                    className="mb-1 text-slate-400 hover:text-[var(--turmeric)]"
                    aria-label="Replay"
                  >
                    <Volume2 size={13} />
                  </button>
                )}
                <p className="whitespace-pre-line">{m.text}</p>
                {m.uiActions?.length ? (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {m.uiActions.map((a: any, i: number) => {
                      const link = actionLink(a.target);
                      if (!link) return null;
                      const { href, label, Icon } = link;
                      return (
                        <Link
                          key={i}
                          href={href}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--paytm-navy)] text-white text-xs font-bold"
                        >
                          <Icon size={12} />
                          {label}
                          <ArrowRight size={11} />
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="text-xs text-slate-500 px-1">Munim Ji soch rahe hain…</div>
          )}
          {transcript && listening && (
            <div className="text-xs italic text-amber-800 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
              “{transcript}”
            </div>
          )}
          {micHint && (
            <div className="text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2">{micHint}</div>
          )}
          <div ref={endRef} />
        </div>

        <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => void send(c)}
              className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700"
            >
              {c}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleMic}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
              listening ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
            }`}
            title={listening ? 'Stop listening' : 'Speak — Munim Ji sends when you finish'}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Poochhein ya type karein…"
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[var(--paytm-navy)]"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="w-10 h-10 rounded-xl bg-[var(--paytm-navy)] text-white flex items-center justify-center disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
