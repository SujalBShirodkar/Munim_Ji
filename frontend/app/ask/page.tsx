'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { MunimOrb } from '@/components/ui/MunimOrb';
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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'user' | 'munim';
  text: string;
  spokenText?: string;
  displaySummary?: string;
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

  // Browser SpeechRecognition for mic input
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    stopSpeaking();
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setActiveTranscript('Listening...');
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
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-ink text-white rounded-tr-none'
                    : 'bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 text-ink dark:text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Header for Munim */}
                {m.sender === 'munim' && (
                  <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-turmeric-600 dark:text-turmeric-500">
                    <span className="flex items-center gap-1">
                      <Sparkles size={13} />
                      Munim Ji
                    </span>
                    {m.spokenText && (
                      <button
                        onClick={() => speakText(m.spokenText!)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                  </div>
                )}

                <p className="whitespace-pre-line">{m.text}</p>

                {/* Inline Action Card Button if tool suggested UI transition */}
                {m.uiActions && m.uiActions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {m.uiActions.map((action, i) => {
                      if (action.target === 'simulator') {
                        return (
                          <Link
                            key={i}
                            href="/whatif"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paytm-cyan text-white text-xs font-bold shadow-sm"
                          >
                            <LineChart size={14} />
                            <span>Open What-If Simulator</span>
                            <ArrowRight size={13} />
                          </Link>
                        );
                      }
                      if (action.target === 'pool') {
                        return (
                          <Link
                            key={i}
                            href="/pool"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-turmeric text-white text-xs font-bold shadow-sm"
                          >
                            <ShoppingBag size={14} />
                            <span>View Sugar Pool Order</span>
                            <ArrowRight size={13} />
                          </Link>
                        );
                      }
                      if (action.target === 'credit') {
                        return (
                          <Link
                            key={i}
                            href="/credit"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mint-dark text-white text-xs font-bold shadow-sm"
                          >
                            <WalletCards size={14} />
                            <span>Review ₹5,000 Credit Offer</span>
                            <ArrowRight size={13} />
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
                    <span>LLM: {m.latencies.llm}ms</span>
                    <span>Total: {m.latencies.total}ms</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Live transcript or thinking indicator */}
          {isThinking && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-paper-darkCard border border-turmeric/30 text-xs text-slate-500 w-fit">
              <RefreshCw size={14} className="animate-spin text-turmeric" />
              <span>{t.thinking}</span>
            </div>
          )}

          {activeTranscript && (
            <div className="p-2.5 rounded-xl bg-turmeric-50 dark:bg-turmeric-950/40 border border-turmeric/40 text-xs text-turmeric-600 italic">
              "{activeTranscript}"
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-paytm-cyan whitespace-nowrap shadow-xs transition"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Bottom Input & Voice Controls */}
        <div className="p-3 bg-white dark:bg-paper-dark border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex items-center gap-2"
          >
            {/* Center Orb for Voice Tap */}
            <div className="shrink-0">
              <MunimOrb
                size="sm"
                isListening={isListening}
                isSpeaking={isSpeaking}
                onClick={toggleListening}
              />
            </div>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? t.listening : 'Poochhein ya type karein...'}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-ink dark:text-white focus:outline-none focus:border-paytm-cyan transition"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className="w-10 h-10 rounded-xl bg-paytm-cyan text-white flex items-center justify-center disabled:opacity-40 shadow-sm"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

