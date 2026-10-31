/**
 * Browser STT/TTS helpers for Munim Ji.
 * Used when Deepgram/Cartesia keys are not configured (demo/local).
 */

export type SpeakLang = 'hi' | 'en';

let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

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
      // Safari / some Chrome builds never fire voiceschanged
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
    (v: SpeechSynthesisVoice) => /google|microsoft|natural|neural/i.test(v.name) && v.lang.toLowerCase().startsWith(want === 'hi' ? 'hi' : 'en'),
  ];
  for (const rule of prefer) {
    const hit = voices.find(rule);
    if (hit) return hit;
  }
  return voices[0] || null;
}

/** Make money / symbols speak cleanly in Hindi/English TTS. */
export function prepareForSpeech(text: string, lang: SpeakLang = 'hi'): string {
  let t = text
    .replace(/₹\s*/g, lang === 'hi' ? 'rupees ' : 'rupees ')
    .replace(/,/g, '')
    .replace(/\//g, ' ')
    .replace(/[•·]/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  // Soften English jargon for Hindi TTS
  if (lang === 'hi') {
    t = t
      .replace(/\bMOQ\b/gi, 'minimum order')
      .replace(/\bQR\b/g, 'Q R')
      .replace(/\bUPI\b/g, 'U P I')
      .replace(/\bPaytm\b/gi, 'Paytm');
  }
  return t;
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function canListen(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
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
  if (!canSpeak()) {
    opts.onError?.('Speech not supported in this browser');
    return;
  }

  const syn = window.speechSynthesis;
  syn.cancel();

  // Chrome bug: sometimes needs a resume after cancel
  try {
    syn.resume();
  } catch {
    /* ignore */
  }

  const voices = await loadVoices();
  const utterance = new SpeechSynthesisUtterance(prepareForSpeech(text, lang));
  utterance.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
  utterance.rate = opts.rate ?? (lang === 'hi' ? 0.95 : 1);
  utterance.pitch = 1;

  const voice = pickVoice(voices, lang);
  if (voice) utterance.voice = voice;

  return new Promise((resolve) => {
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

    // Safety: some browsers never fire onend
    const approxMs = Math.max(2500, prepareForSpeech(text, lang).length * 70);
    setTimeout(finish, approxMs + 1500);
  });
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}

export type ListenHandlers = {
  lang?: SpeakLang;
  onStart?: () => void;
  onPartial?: (text: string) => void;
  onFinal?: (text: string, confidence?: number) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
};

export type ListenerHandle = {
  stop: () => void;
};

/** Start one-shot browser speech recognition (Chrome / Edge best). */
export function startListening(handlers: ListenHandlers = {}): ListenerHandle {
  const SR =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  if (!SR) {
    handlers.onError?.(
      'Mic listening needs Chrome or Edge. You can still type your question.'
    );
    return { stop: () => undefined };
  }

  const lang = handlers.lang ?? 'hi';
  const recognition = new SR();
  recognition.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let stopped = false;
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
      } else {
        interim += piece;
      }
    }

    if (interim) handlers.onPartial?.(interim);
    if (finalText.trim()) {
      gotFinal = true;
      handlers.onPartial?.(finalText.trim());
      handlers.onFinal?.(finalText.trim(), conf);
    }
  };

  recognition.onerror = (event: any) => {
    const code = event?.error || 'error';
    const map: Record<string, string> = {
      'not-allowed': 'Mic permission blocked. Allow microphone for localhost.',
      'no-speech': 'Kuch suna nahi — dobara bolein.',
      aborted: '',
      network: 'Network error during listening. Check internet.',
      'audio-capture': 'No microphone found.',
      'service-not-allowed': 'Speech service blocked in this browser.',
    };
    const msg = map[code] ?? `Mic error: ${code}`;
    if (msg) handlers.onError?.(msg);
  };

  recognition.onend = () => {
    if (!stopped && !gotFinal) {
      // ended without final — still notify UI
    }
    handlers.onEnd?.();
  };

  try {
    // Barge-in: stop any playing TTS when user starts talking
    stopSpeaking();
    recognition.start();
  } catch (e: any) {
    handlers.onError?.(e?.message || 'Could not start mic');
  }

  return {
    stop: () => {
      stopped = true;
      try {
        recognition.stop();
      } catch {
        try {
          recognition.abort();
        } catch {
          /* ignore */
        }
      }
    },
  };
}

/** Warm voices early (call once on Ask / Home mount). */
export function warmSpeech() {
  void loadVoices();
}
