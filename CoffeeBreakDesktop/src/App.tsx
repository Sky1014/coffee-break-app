import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_DURATION_SECONDS = 60;

type Phase = 'waiting' | 'counting' | 'done' | 'bridge-error';
type BreakPayload = {
  durationSeconds?: number;
  startedAt?: number;
  assets?: {
    coffeePourUrl?: string;
  };
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function CoffeeCup({ progress, pouring }: { progress: number; pouring: boolean }) {
  return (
    <div className="coffee-cup" aria-hidden="true">
      <div className="steam steam-one" />
      <div className="steam steam-two" />
      <div
        className="pour-stream"
        style={{
          opacity: pouring ? String(0.22 + (1 - progress) * 0.68) : '0',
          transform: `scaleY(${pouring ? 0.78 + progress * 0.22 : 0.35})`
        }}
      />
      <div className="cup-body">
        <div className="coffee-fill" style={{ height: `${Math.max(9, progress * 100)}%` }} />
      </div>
      <div className="cup-handle" />
      <div className="saucer" />
    </div>
  );
}

function ProgressRing({ progress, children }: { progress: number; children: React.ReactNode }) {
  const degrees = Math.round(clamp(progress, 0, 1) * 360);
  return (
    <div className="ring-shell" style={{ '--progress-deg': `${degrees}deg` } as React.CSSProperties}>
      <div className="ring-inner">{children}</div>
    </div>
  );
}

export default function App() {
  const [duration, setDuration] = useState(DEFAULT_DURATION_SECONDS);
  const [remaining, setRemaining] = useState(DEFAULT_DURATION_SECONDS);
  const [startedAt, setStartedAt] = useState(Date.now());
  const [phase, setPhase] = useState<Phase>(() => (window.coffeeBreak ? 'waiting' : 'bridge-error'));
  const sentComplete = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fileAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileAudioUrlRef = useRef('');
  const breakStartedAtRef = useRef(0);

  function writeLog(message: string) {
    window.coffeeBreak?.log(message);
  }

  useEffect(() => {
    return () => {
      stopPourAudio();
      fileAudioRef.current = null;
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, []);

  function prepareFileAudio(audioUrl?: string) {
    if (!audioUrl) return;
    if (fileAudioRef.current && fileAudioUrlRef.current === audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = 0.85;
    fileAudioRef.current = audio;
    fileAudioUrlRef.current = audioUrl;
  }

  function getAudioContext() {
    if (audioContextRef.current) return audioContextRef.current;
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextCtor();
    audioContextRef.current = context;
    return context;
  }

  function createPourBuffer(context: AudioContext, durationSeconds: number) {
    const sampleRate = context.sampleRate;
    const sampleCount = Math.max(1, Math.floor(durationSeconds * sampleRate));
    const buffer = context.createBuffer(2, sampleCount, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    let creekBase = 0;
    let creekBody = 0;
    let shimmerState = 0;
    let seed = 177;

    function random() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967295;
    }

    for (let i = 0; i < sampleCount; i += 1) {
      const t = i / sampleRate;
      const progress = t / durationSeconds;
      const fadeIn = smoothstep(0, 0.075, progress);
      const lateFade = 1 - smoothstep(0.58, 0.96, progress) * 0.78;
      const pourEnvelope = fadeIn * lateFade;
      const cupEnvelope = smoothstep(0.06, 0.88, progress);
      const endDrizzle = smoothstep(0.68, 1, progress);

      const noise = random() * 2 - 1;
      creekBase = creekBase * 0.996 + noise * 0.004;
      creekBody = creekBody * 0.93 + noise * 0.07;
      shimmerState = shimmerState * 0.72 + noise * 0.28;

      const rippleOne = Math.sin(2 * Math.PI * (1.35 + progress * 0.2) * t + creekBase * 5.5);
      const rippleTwo = Math.sin(2 * Math.PI * (2.15 + progress * 0.35) * t + creekBody * 2.2);
      const rippleThree = Math.sin(2 * Math.PI * (3.4 + progress * 0.5) * t + creekBase * 7.2);
      const rollingWater = (rippleOne * 0.18 + rippleTwo * 0.12 + rippleThree * 0.07) * pourEnvelope;
      const softCurrent = creekBase * 1.1 * pourEnvelope;
      const pebbleBurble = Math.tanh(creekBody * 2.4) * 0.16 * pourEnvelope;
      const smallSparkle = shimmerState * 0.045 * pourEnvelope * (0.45 + Math.max(0, rippleTwo) * 0.55);
      const cupTone = Math.sin(2 * Math.PI * (145 + cupEnvelope * 82) * t) * 0.028 * cupEnvelope;
      const cupBody = Math.sin(2 * Math.PI * (31 + cupEnvelope * 8) * t + creekBase * 2.8) * 0.026 * cupEnvelope;
      const thinTrickle = Math.sin(2 * Math.PI * (8 + progress * 12) * t + creekBody) * 0.038 * endDrizzle;
      const sample = clamp(softCurrent + rollingWater + pebbleBurble + smallSparkle + cupTone + cupBody + thinTrickle, -0.78, 0.78);

      const pan = Math.sin(t * 1.7 + creekBase) * 0.11;
      left[i] = sample * (0.96 - pan);
      right[i] = sample * (0.96 + pan);
    }

    let eventTime = 0.18;
    while (eventTime < durationSeconds) {
      const progress = eventTime / durationSeconds;
      const interval = 0.18 + progress * progress * 0.56 + random() * 0.2;
      const amp = 0.018 + smoothstep(0.55, 1, progress) * 0.055 + random() * 0.026;
      const frequency = 260 + random() * 340 + smoothstep(0.7, 1, progress) * 180;
      const pan = random() * 2 - 1;
      const start = Math.floor(eventTime * sampleRate);
      const length = Math.floor((0.055 + random() * 0.075) * sampleRate);

      for (let j = 0; j < length && start + j < sampleCount; j += 1) {
        const localT = j / sampleRate;
        const decay = Math.exp(-localT * (24 + random() * 6));
        const tick = Math.sin(2 * Math.PI * frequency * localT) * amp * decay;
        left[start + j] = clamp(left[start + j] + tick * (1 - Math.max(0, pan) * 0.45), -0.9, 0.9);
        right[start + j] = clamp(right[start + j] + tick * (1 + Math.min(0, pan) * 0.45), -0.9, 0.9);
      }

      eventTime += interval;
    }

    return buffer;
  }

  function startPourAudio(nextDuration: number) {
    stopPourAudio();
    const fileAudio = fileAudioRef.current;
    if (fileAudio) {
      fileAudio.pause();
      fileAudio.currentTime = 0;
      fileAudio.playbackRate = 1;
      fileAudio.volume = 0.85;
      fileAudio.play().then(() => {
        writeLog(`coffee pour file audio started; duration=${nextDuration}`);
      }).catch((error: unknown) => {
        writeLog(`coffee pour file audio failed, using fallback: ${String(error)}`);
        startGeneratedPourAudio(nextDuration);
      });
      return;
    }

    startGeneratedPourAudio(nextDuration);
  }

  function startGeneratedPourAudio(nextDuration: number) {
    try {
      const context = getAudioContext();
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = createPourBuffer(context, nextDuration);
      gain.gain.setValueAtTime(0.72, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.46, context.currentTime + nextDuration * 0.72);
      gain.gain.linearRampToValueAtTime(0.34, context.currentTime + nextDuration);
      source.connect(gain);
      gain.connect(context.destination);
      audioSourceRef.current = source;
      context.resume().then(() => {
        source.start();
        writeLog(`coffee pour audio started; state=${context.state}; duration=${nextDuration}`);
      }).catch((error: unknown) => {
        writeLog(`coffee pour audio resume failed: ${String(error)}`);
      });
    } catch (error) {
      writeLog(`coffee pour audio failed: ${String(error)}`);
    }
  }

  function stopPourAudio() {
    const fileAudio = fileAudioRef.current;
    if (fileAudio) {
      fileAudio.pause();
      fileAudio.currentTime = 0;
    }

    const source = audioSourceRef.current;
    audioSourceRef.current = null;
    if (!source) return;
    try {
      source.stop();
      source.disconnect();
    } catch {
      // Source may already have stopped.
    }
  }

  function playButtonClickTestTone() {
    try {
      const context = getAudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 520;
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
      oscillator.connect(gain);
      gain.connect(context.destination);
      context.resume().then(() => {
        oscillator.start();
        oscillator.stop(context.currentTime + 0.18);
      }).catch(() => {});
    } catch {
      // The button action itself should still work if audio fails.
    }
  }

  function beginBreak(payload: BreakPayload) {
    const nextDuration = payload.durationSeconds || DEFAULT_DURATION_SECONDS;
    const nextStartedAt = payload.startedAt || Date.now();
    if (breakStartedAtRef.current === nextStartedAt) return;

    prepareFileAudio(payload.assets?.coffeePourUrl);
    breakStartedAtRef.current = nextStartedAt;
    sentComplete.current = false;
    setDuration(nextDuration);
    setRemaining(nextDuration);
    setStartedAt(nextStartedAt);
    setPhase('counting');
    startPourAudio(nextDuration);
  }

  useEffect(() => {
    if (!window.coffeeBreak) {
      setPhase('bridge-error');
      return;
    }

    const cleanup = window.coffeeBreak.onBreakStarted((payload) => {
      beginBreak(payload);
    });

    window.coffeeBreak.getBreakState().then((payload) => {
      if (payload.active) beginBreak(payload);
    });

    return cleanup;
  }, []);

  useEffect(() => {
    if (phase !== 'counting') return;

    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const nextRemaining = clamp(duration - elapsed, 0, duration);
      setRemaining(nextRemaining);

      if (nextRemaining <= 0 && !sentComplete.current) {
        sentComplete.current = true;
        setPhase('done');
        stopPourAudio();
        window.setTimeout(() => {
          window.coffeeBreak?.sendBreakAction('complete');
        }, 1600);
      }
    }, 180);

    return () => window.clearInterval(interval);
  }, [duration, phase, startedAt]);

  const progress = useMemo(() => {
    if (phase === 'done') return 1;
    if (phase === 'waiting' || phase === 'bridge-error') return 0;
    return clamp(1 - remaining / duration, 0, 1);
  }, [duration, phase, remaining]);

  const seconds = Math.ceil(remaining);

  function sendAction(action: BreakAction) {
    playButtonClickTestTone();
    stopPourAudio();
    window.coffeeBreak?.sendBreakAction(action);
    if (!window.coffeeBreak) {
      sentComplete.current = false;
      setRemaining(duration);
      setStartedAt(Date.now());
      setPhase('counting');
    }
  }

  return (
    <main className="break-window">
      <section className="break-panel" aria-live="polite">
        <div className="mode-label">Standard Mode</div>

        <ProgressRing progress={progress}>
          <CoffeeCup progress={progress} pouring={phase === 'counting'} />
        </ProgressRing>

        <div className="copy-block">
          <h1>
            {phase === 'done'
              ? 'Body Reset.'
              : phase === 'bridge-error'
                ? 'Coffee Break needs a restart.'
                : 'Coffee Break is ready.'}
          </h1>
          <p>
            {phase === 'done'
              ? 'Sitting streak broken.'
              : phase === 'bridge-error'
                ? 'The desktop bridge did not load.'
                : "One full minute. Then you're free."}
          </p>
        </div>

        <div className="countdown" aria-label={`${seconds} seconds remaining`}>
          {phase === 'done' || phase === 'bridge-error' || phase === 'waiting' ? '00' : String(seconds).padStart(2, '0')}
        </div>

        <div className="actions" aria-label="Break actions">
          <button type="button" onClick={() => sendAction('snooze')} disabled={phase !== 'counting'}>
            Snooze 5 min
          </button>
          <button type="button" className="ghost" onClick={() => sendAction('skip')} disabled={phase !== 'counting'}>
            Skip
          </button>
        </div>
      </section>
    </main>
  );
}
