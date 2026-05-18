'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type SupportedLanguage =
  | 'English'
  | 'Spanish'
  | 'Hindi'
  | 'French'
  | 'Arabic'
  | 'Portuguese'
  | 'Chinese'
  | 'Russian';

function stripForSpeech(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[([^\]]+)\]\((.*?)\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>-]/g, ' ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getLanguageCode(language: SupportedLanguage) {
  switch (language) {
    case 'Spanish':
      return 'es-ES';
    case 'Hindi':
      return 'hi-IN';
    case 'French':
      return 'fr-FR';
    case 'Arabic':
      return 'ar-SA';
    case 'Portuguese':
      return 'pt-PT';
    case 'Chinese':
      return 'zh-CN';
    case 'Russian':
      return 'ru-RU';
    case 'English':
    default:
      return 'en-US';
  }
}

function getLanguagePrefixes(language: SupportedLanguage) {
  const code = getLanguageCode(language).toLowerCase();
  const base = code.split('-')[0];
  return [code, base];
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  language: SupportedLanguage
): SpeechSynthesisVoice | null {
  const prefixes = getLanguagePrefixes(language);

  const exact = voices.find((voice) =>
    prefixes.some((prefix) => voice.lang?.toLowerCase() === prefix)
  );
  if (exact) return exact;

  const startsWith = voices.find((voice) =>
    prefixes.some((prefix) => voice.lang?.toLowerCase().startsWith(prefix))
  );
  if (startsWith) return startsWith;

  const includes = voices.find((voice) =>
    prefixes.some((prefix) => voice.lang?.toLowerCase().includes(prefix))
  );
  if (includes) return includes;

  return null;
}

export default function ReadAloudButton({
  text,
  language = 'English',
  label = 'Read Aloud'
}: {
  text: string;
  language?: SupportedLanguage;
  label?: string;
}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speechText = useMemo(() => stripForSpeech(text), [text]);
  const selectedVoice = useMemo(() => pickVoice(voices, language), [voices, language]);

  const missingRequestedVoice =
    language !== 'English' && voices.length > 0 && !selectedVoice;

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance !== 'undefined';

    setIsSupported(supported);

    if (!supported) return;

    function loadVoices() {
      const nextVoices = window.speechSynthesis.getVoices();
      setVoices(nextVoices);
    }

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    const fallbackTimer = window.setTimeout(loadVoices, 600);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  function stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    utteranceRef.current = null;
    setIsSpeaking(false);
  }

  function startSpeech() {
    if (!isSupported || !speechText) return;

    if (missingRequestedVoice) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = getLanguageCode(language);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }

  if (!isSupported || !speechText) return null;

  if (missingRequestedVoice) {
    return (
      <div style={{ display: 'grid', gap: 6, maxWidth: '100%' }}>
        <button
          type="button"
          className="secondary readAloudButton"
          disabled
          title={`${language} speech voice is not available in this browser or device.`}
          style={{
            minWidth: 132,
            justifyContent: 'center'
          }}
        >
          {language} voice unavailable
        </button>

        <p className="small" style={{ margin: 0 }}>
          This browser or device does not currently expose a {language} speech voice. The translated
          text is still available visually.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="secondary readAloudButton"
      onClick={isSpeaking ? stopSpeech : startSpeech}
      aria-pressed={isSpeaking}
      aria-label={isSpeaking ? 'Stop reading aloud' : label}
      style={{
        minWidth: 132,
        justifyContent: 'center'
      }}
    >
      {isSpeaking ? 'Stop Reading' : label}
    </button>
  );
}