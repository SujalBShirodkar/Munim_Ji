/**
 * Munim Ji speech helpers:
 * - Prefers Cartesia TTS + Deepgram STT via backend when configured
 * - Falls back to browser Web Speech API
 */

export type SpeakLang = 'hi' | 'en';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;
let voiceStatusCache: { tts: boolean; stt: boolean } | null = null;
let currentAudio: HTMLAudioElement | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([]);
  }
  if (!voicesReady) {
    voicesReady = new Promise((resolve) => {
      const syn = window.speechSynthesis;
      const existing = syn.getVoices();
      if (existing.length) {
        resolve(existing);
        return;
      }
      const done = () => {
        syn.removeEventListener('voiceschanged', done);
        resolve(syn.getVoices());
      };
      syn.addEventListener('voiceschanged', done);
      setTimeout(() => resolve(syn.getVoices()), 600);
    });
  }
  return voicesReady;
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: SpeakLang): SpeechSynthesisVoice | null {
  const want = lang === 'en' ? 'en' : 'hi';
  const prefer = [
    (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith(want === 'hi' ? 'hi' : 'en-in'),
    (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith(want),
    (v: SpeechSynthesisVoice) =>
      /google|microsoft|natural|neural/i.test(v.name) &&
      v.lang.toLowerCase().startsWith(want === 'hi' ? 'hi' : 'en'),
  ];
  for (const rule of prefer) {
    const hit = voices.find(rule);
    if (hit) return hit;
  }
  return voices[0] || null;
}

export function prepareForSpeech(text: string, lang: SpeakLang = 'hi'): string {
  let t = text
    .replace(/₹\s*/g, 'rupees ')
    .replace(/,/g, '')
    .replace(/\//g, ' ')
    .replace(/[•·]/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  if (lang === 'hi') {
    t = t
      .replace(/\bMOQ\b/gi, 'minimum order')
      .replace(/\bQR\b/g, 'Q R')
      .replace(/\bUPI\b/g, 'U P I');
  }
  return t;
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function canListen(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  );
}

export async function refreshVoiceStatus(): Promise<{ tts: boolean; stt: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/assistant/voice-status`, { credentials: 'include' });
    if (!res.ok) throw new Error('status failed');
    const data = await res.json();
    voiceStatusCache = { tts: !!data.tts, stt: !!data.stt };
  } catch {
    voiceStatusCache = { tts: false, stt: false };
  }
  return voiceStatusCache;
}

async function getVoiceStatus() {
  if (voiceStatusCache) return voiceStatusCache;
  return refreshVoiceStatus();
}

async function speakViaCartesia(
  text: string,
  lang: SpeakLang,
  opts: { onStart?: () => void; onEnd?: () => void; onError?: (msg: string) => void }
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/assistant/tts`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: prepareForSpeech(text, lang), language: lang }),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    stopSpeaking();
    const audio = new Audio(url);
    currentAudio = audio;
    opts.onStart?.();
    await new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        opts.onEnd?.();
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        opts.onError?.('Audio playback failed');
        opts.onEnd?.();
        resolve();
      };
      void audio.play().catch(() => {
        opts.onError?.('Audio play blocked');
        opts.onEnd?.();
        resolve();
      });
    });
    return true;
  } catch {
    return false;
  }
}

async function speakViaBrowser(
  text: string,
  lang: SpeakLang,
  opts: {
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (msg: string) => void;
  }
): Promise<void> {
  if (!canSpeak()) {
    opts.onError?.('Speech not supported in this browser');
    return;
  }
  const syn = window.speechSynthesis;
  syn.cancel();
  try {
    syn.resume();
  } catch {
    /* ignore */
  }

  const voices = await loadVoices();
  const utterance = new SpeechSynthesisUtterance(prepareForSpeech(text, lang));
  utterance.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
  utterance.rate = opts.rate ?? (lang === 'hi' ? 0.95 : 1);
  const voice = pickVoice(voices, lang);
  if (voice) utterance.voice = voice;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      opts.onEnd?.();
      resolve();
    };
    utterance.onstart = () => opts.onStart?.();
    utterance.onend = finish;
    utterance.onerror = () => {
      opts.onError?.('Could not play voice');
      finish();
    };
    syn.speak(utterance);
    const approxMs = Math.max(2500, prepareForSpeech(text, lang).length * 70);
    setTimeout(finish, approxMs + 1500);
  });
}

export async function speakText(
  text: string,
  opts: {
    lang?: SpeakLang;
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (msg: string) => void;
  } = {}
): Promise<void> {
  const lang = opts.lang ?? 'hi';
  if (!text.trim()) return;

  const status = await getVoiceStatus();
  if (status.tts) {
    const ok = await speakViaCartesia(text, lang, opts);
    if (ok) return;
  }
  await speakViaBrowser(text, lang, opts);
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export type ListenHandlers = {
  lang?: SpeakLang;
  onStart?: () => void;
  onPartial?: (text: string) => void;
  onFinal?: (text: string, confidence?: number) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
};

export type ListenerHandle = { stop: () => void };

/** Deepgram via MediaRecorder when available; else browser SpeechRecognition. */
export function startListening(handlers: ListenHandlers = {}): ListenerHandle {
  let stopped = false;
  let mediaRecorder: MediaRecorder | null = null;
  let recognition: any = null;
  const chunks: BlobPart[] = [];

  const finishCleanup = () => {
    handlers.onEnd?.();
  };

  const startBrowserSR = () => {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      handlers.onError?.('Mic not supported. Type your question instead.');
      return;
    }
    const lang = handlers.lang ?? 'hi';
    recognition = new SR();
    recognition.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    let gotFinal = false;

    recognition.onstart = () => handlers.onStart?.();
    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      let conf = 0.9;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const piece = res[0]?.transcript || '';
        if (res.isFinal) {
          finalText += piece;
          conf = res[0]?.confidence ?? conf;
        } else interim += piece;
      }
      if (interim) handlers.onPartial?.(interim);
      if (finalText.trim()) {
        gotFinal = true;
        handlers.onFinal?.(finalText.trim(), conf);
      }
    };
    recognition.onerror = (event: any) => {
      const code = event?.error || 'error';
      const map: Record<string, string> = {
        'not-allowed': 'Mic permission blocked. Allow microphone for localhost.',
        'no-speech': 'Kuch suna nahi — dobara bolein.',
        aborted: '',
        network: 'Network error during listening.',
        'audio-capture': 'No microphone found.',
      };
      const msg = map[code] ?? `Mic error: ${code}`;
      if (msg) handlers.onError?.(msg);
    };
    recognition.onend = () => {
      if (!gotFinal && !stopped) handlers.onPartial?.('');
      finishCleanup();
    };
    try {
      stopSpeaking();
      recognition.start();
    } catch (e: any) {
      handlers.onError?.(e?.message || 'Could not start mic');
    }
  };

  const startDeepgramRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
      chunks.length = 0;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstart = () => {
        handlers.onStart?.();
        handlers.onPartial?.('Listening…');
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (stopped) {
          finishCleanup();
          return;
        }
        const blob = new Blob(chunks, { type: mime });
        if (blob.size < 500) {
          handlers.onError?.('Kuch suna nahi — dobara bolein.');
          finishCleanup();
          return;
        }
        handlers.onPartial?.('Samajh rahe hain…');
        try {
          const form = new FormData();
          form.append('file', blob, 'speech.webm');
          form.append('language', handlers.lang ?? 'hi');
          const res = await fetch(`${API_BASE}/assistant/stt`, {
            method: 'POST',
            credentials: 'include',
            body: form,
          });
          if (!res.ok) throw new Error('STT failed');
          const data = await res.json();
          const text = (data.transcript || '').trim();
          if (!text) {
            handlers.onError?.('Samajh nahi aaya — dobara bolein ya type karein.');
          } else {
            handlers.onFinal?.(text, data.confidence ?? 0.9);
          }
        } catch {
          handlers.onError?.('Voice server busy — try browser mic or type.');
          // last resort browser SR one-shot not auto-started to avoid double prompt
        }
        finishCleanup();
      };
      stopSpeaking();
      mediaRecorder.start();
      // Auto-stop after 6s if user doesn't tap stop
      setTimeout(() => {
        if (!stopped && mediaRecorder && mediaRecorder.state === 'recording') {
          handlers.onPartial?.('Processing…');
          mediaRecorder.stop();
        }
      }, 6000);
    } catch {
      handlers.onError?.('Mic permission blocked. Allow microphone.');
      startBrowserSR();
    }
  };

  void (async () => {
    const status = await getVoiceStatus();
    if (status.stt && navigator.mediaDevices?.getUserMedia) {
      await startDeepgramRecording();
    } else {
      startBrowserSR();
    }
  })();

  return {
    stop: () => {
      stopped = true;
      try {
        if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
      } catch {
        /* ignore */
      }
      try {
        recognition?.stop?.();
      } catch {
        try {
          recognition?.abort?.();
        } catch {
          /* ignore */
        }
      }
    },
  };
}

export function warmSpeech() {
  void loadVoices();
  void refreshVoiceStatus();
}
