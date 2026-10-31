'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  TrendingUp,
  LineChart,
  ShoppingBag,
  WalletCards,
  RefreshCw,
  Clock,
  Mic,
  MicOff,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'munim';
  text: string;
  spokenText?: string;
  uiActions?: any[];
  latencies?: any;
  timestamp: Date;
}

export default function AskMunimPage() {
  const { lang, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'munim',
      text: 'Namaste Sharma ji! Main Munim Ji hoon. Kal ki bikri, chai ke daam badhane ka faisla, ya cheeni ke group order ke baare me poochhein.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    'Kal ki bikri kitni thi?',
    'Agar main chai ₹2 mehngi kar du toh kya hoga?',
    'Cheeni ke liye group order hai kya?',
    'Mujhe ₹5,000 chahiye'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, activeTranscript]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    stopSpeaking();

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setActiveTranscript('');
    setIsThinking(true);

    try {
      const response = await api.sendChatMessage(trimmed, lang);

      const munimMsg: Message = {
        id: `munim-${Date.now()}`,
        sender: 'munim',
        text: response.display_text || response.spoken_text,
        spokenText: response.spoken_text,
        uiActions: response.ui_actions || [],
        latencies: response.latencies,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, munimMsg]);

      // Speak back
      if (response.spoken_text) {
        speakText(response.spoken_text);
      }
    } catch (err: any) {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'munim',
        text: 'Maaf kijiye, abhi hum aapki darkhwast poori nahi kar paaye. Kripya dobara koshish karein.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query below.');
      return;
    }

    stopSpeaking();
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setActiveTranscript('Listening to shopkeeper...');
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setActiveTranscript(transcript);

      if (event.results[0].isFinal) {
        setIsListening(false);
        handleSendMessage(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setActiveTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <AppShell hideNav={false}>
      <div className="flex flex-col h-[calc(100vh-130px)] bg-[#F4F6F9] dark:bg-slate-900">
        {/* Header */}
        <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#D97706]" />
                Munim Ji Voice Assistant
              </h2>
              <p className="text-[10px] text-slate-400">Deterministic tools • Zero hallucinations</p>
            </div>
          </div>

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="text-[11px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-800 flex items-center gap-1"
            >
              <VolumeX size={13} />
              <span>Mute</span>
            </button>
          )}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-[#002970] text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Assistant Header */}
                {m.sender === 'munim' && (
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-[#D97706]">
                    <span className="flex items-center gap-1">
                      <Sparkles size={12} />
                      Munim Ji
                    </span>
                    {m.spokenText && (
                      <button
                        onClick={() => speakText(m.spokenText!)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                        title="Replay Voice"
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                  </div>
                )}

                <p className="whitespace-pre-line text-xs sm:text-[13px] leading-relaxed">{m.text}</p>

                {/* Inline Action Card Button if tool suggested UI transition */}
                {m.uiActions && m.uiActions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2">
                    {m.uiActions.map((action, i) => {
                      if (action.target === 'simulator') {
                        return (
                          <Link
                            key={i}
                            href="/whatif"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#002970] text-white text-xs font-bold shadow-xs hover:bg-[#001d52]"
                          >
                            <LineChart size={13} />
                            <span>Open Price Simulator</span>
                            <ArrowRight size={12} />
                          </Link>
                        );
                      }
                      if (action.target === 'pool') {
                        return (
                          <Link
                            key={i}
                            href="/pool"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold shadow-xs hover:bg-amber-700"
                          >
                            <ShoppingBag size={13} />
                            <span>View Sugar Pool Order</span>
                            <ArrowRight size={12} />
                          </Link>
                        );
                      }
                      if (action.target === 'credit') {
                        return (
                          <Link
                            key={i}
                            href="/credit"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700"
                          >
                            <WalletCards size={13} />
                            <span>Review ₹5,000 Credit Offer</span>
                            <ArrowRight size={12} />
                          </Link>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}

                {/* Latency info badge */}
                {m.latencies && (
                  <div className="mt-2 pt-1 text-[9px] text-slate-400 flex items-center justify-between font-mono">
                    <span>Tool latency: {m.latencies.llm}ms</span>
                    <span>Total response: {m.latencies.total}ms</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Thinking State */}
          {isThinking && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 w-fit shadow-xs">
              <RefreshCw size={14} className="animate-spin text-[#002970] dark:text-[#00BAF2]" />
              <span>Munim Ji calculating database numbers...</span>
            </div>
          )}

          {activeTranscript && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 text-xs text-amber-900 dark:text-amber-200 italic font-medium">
              "{activeTranscript}"
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-100 dark:bg-slate-800/50">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#00BAF2] whitespace-nowrap shadow-2xs transition"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Bottom Input & Mic */}
        <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-2"
          >
            {/* Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition shadow-xs ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice query'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Poochhein ya type karein (e.g. Kal ki bikri)...'}
              className="flex-1 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#002970]"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="w-10 h-10 rounded-xl bg-[#002970] text-white flex items-center justify-center disabled:opacity-40 shadow-xs hover:bg-[#001d52]"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
