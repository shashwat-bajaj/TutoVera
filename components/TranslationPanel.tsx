'use client';

import { useState } from 'react';
import RenderedContent from '@/components/RenderedContent';

const LANGUAGES = [
  'Spanish',
  'Hindi',
  'French',
  'Arabic',
  'Portuguese',
  'Chinese',
  'Russian'
] as const;

type Language = (typeof LANGUAGES)[number];

function getLanguageCode(language: Language) {
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
    default:
      return 'en-US';
  }
}

function getLanguageDirection(language: Language) {
  return language === 'Arabic' ? 'rtl' : 'ltr';
}

export default function TranslationPanel({ text }: { text: string }) {
  const [language, setLanguage] = useState<Language>('Spanish');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const translatedDirection = getLanguageDirection(language);
  const translatedLanguageCode = getLanguageCode(language);
  const isRtl = translatedDirection === 'rtl';

  async function translateText() {
    setLoading(true);
    setError('');
    setTranslated('');

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Translation failed.');
        return;
      }

      setTranslated(data.translated || '');
    } catch {
      setError('Translation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="translationPanel">
      <div className="translationControls">
        <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
          {LANGUAGES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button type="button" className="secondary" onClick={translateText} disabled={loading}>
          {loading ? 'Translating...' : 'Translate'}
        </button>
      </div>

      {error ? <p className="small">{error}</p> : null}

      {translated ? (
        <div
          className="card translatedSurface"
          dir={translatedDirection}
          lang={translatedLanguageCode}
          style={{
            textAlign: isRtl ? 'right' : 'left'
          }}
        >
          <p className="small">
            <strong>Translated to {language}</strong>
          </p>
          <RenderedContent content={translated} />
        </div>
      ) : null}
    </div>
  );
}