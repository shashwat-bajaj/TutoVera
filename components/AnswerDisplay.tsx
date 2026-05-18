'use client';

import { useEffect, useState } from 'react';
import RenderedContent from '@/components/RenderedContent';
import ReadAloudButton from '@/components/ReadAloudButton';
import { createClient } from '@/lib/supabase/client';

const LANGUAGES = [
  'English',
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
    case 'English':
    default:
      return 'en-US';
  }
}

function getLanguageDirection(language: Language) {
  return language === 'Arabic' ? 'rtl' : 'ltr';
}

export default function AnswerDisplay({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState(text);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('English');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('English');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const displayDirection = getLanguageDirection(currentLanguage);
  const displayLanguageCode = getLanguageCode(currentLanguage);
  const isRtl = displayDirection === 'rtl';

  useEffect(() => {
    setDisplayText(text);
    setCurrentLanguage('English');
    setShowLanguagePicker(false);
    setLoading(false);
    setError('');

    async function loadPreference() {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      const preferredLanguage = user?.user_metadata?.preferences?.translationLanguage || 'English';

      if (typeof preferredLanguage === 'string' && LANGUAGES.includes(preferredLanguage as Language)) {
        setSelectedLanguage(preferredLanguage as Language);
      } else {
        setSelectedLanguage('English');
      }
    }

    void loadPreference();
  }, [text]);

  async function handleLanguageChange(nextLanguage: Language) {
    setError('');
    setSelectedLanguage(nextLanguage);
    setCurrentLanguage(nextLanguage);

    if (nextLanguage === 'English') {
      setDisplayText(text);
      setShowLanguagePicker(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: nextLanguage })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Translation failed.');
        setCurrentLanguage('English');
        setDisplayText(text);
        return;
      }

      setDisplayText(data.translated || text);
      setShowLanguagePicker(false);
    } catch {
      setError('Translation failed.');
      setCurrentLanguage('English');
      setDisplayText(text);
    } finally {
      setLoading(false);
    }
  }

  function resetToEnglish() {
    setSelectedLanguage('English');
    setCurrentLanguage('English');
    setDisplayText(text);
    setShowLanguagePicker(false);
    setError('');
    setLoading(false);
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div
        style={{
          display: 'grid',
          gap: 12,
          paddingBottom: 14,
          borderBottom: '1px solid var(--border)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'flex-start',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'grid', gap: 4 }}>
            <p className="small" style={{ margin: 0 }}>
              <strong>Answer tools</strong>
            </p>
            <p className="small" style={{ margin: 0 }}>
              Read aloud or switch languages without leaving the current response.
            </p>
          </div>

          {currentLanguage !== 'English' ? (
            <span className="badge">Showing: {currentLanguage}</span>
          ) : null}
        </div>

        <div className="buttonRow">
          <ReadAloudButton
            text={displayText}
            language={currentLanguage}
            label={currentLanguage === 'English' ? 'Read Aloud' : `Read Aloud (${currentLanguage})`}
          />

          <button
            type="button"
            className="secondary"
            onClick={() => setShowLanguagePicker((prev) => !prev)}
          >
            {currentLanguage === 'English' ? 'Translate' : 'Change Language'}
          </button>

          {currentLanguage !== 'English' ? (
            <button type="button" className="secondary" onClick={resetToEnglish}>
              Back to English
            </button>
          ) : null}
        </div>

        {showLanguagePicker ? (
          <div className="languagePickerRow">
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="languageSelect"
              disabled={loading}
            >
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {loading ? (
          <p className="small" style={{ margin: 0 }}>
            Translating...
          </p>
        ) : null}

        {error ? (
          <p className="small" style={{ margin: 0 }}>
            {error}
          </p>
        ) : null}
      </div>

      <div
        dir={displayDirection}
        lang={displayLanguageCode}
        style={{
          display: 'grid',
          gap: 0,
          textAlign: isRtl ? 'right' : 'left'
        }}
      >
        <RenderedContent content={displayText} />
      </div>
    </div>
  );
}