import { useEffect, useState, useCallback } from 'react';
import { t, getLocale, setLocale, type Locale } from './i18n';

type Settings = {
  workMinutes: number;
  breakSeconds: number;
  launchAtStartup: boolean;
  locale: Locale;
};

const DEFAULTS: Settings = {
  workMinutes: 30,
  breakSeconds: 60,
  launchAtStartup: false,
  locale: 'en'
};

function displayBreakMinutes(seconds: number): string {
  const mins = seconds / 60;
  // Show integer if whole, otherwise one decimal
  return mins % 1 === 0 ? mins.toFixed(0) : mins.toFixed(1);
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [shortcutMsg, setShortcutMsg] = useState('');

  useEffect(() => {
    if (!window.coffeeBreak) {
      // Fallback for dev: load from localStorage
      try {
        const stored = localStorage.getItem('coffee-break-settings');
        if (stored) {
          setSettings({ ...DEFAULTS, ...JSON.parse(stored) });
        }
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    window.coffeeBreak.getSettings().then((s) => {
      setSettings({ ...DEFAULTS, ...s });
      setLocale(s.locale || 'en');
      setLoading(false);
    });

    const cleanup = window.coffeeBreak.onSettingsChanged((s) => {
      setSettings({ ...DEFAULTS, ...s });
      setLocale(s.locale || 'en');
    });

    return cleanup;
  }, []);

  const handleSave = useCallback(async () => {
    setSaved(false);
    setLocale(settings.locale);

    if (window.coffeeBreak) {
      await window.coffeeBreak.saveSettings(settings);
    } else {
      try {
        localStorage.setItem('coffee-break-settings', JSON.stringify(settings));
      } catch { /* ignore */ }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }, [settings]);

  const handleCreateShortcut = useCallback(async () => {
    setShortcutMsg('');
    if (!window.coffeeBreak) {
      setShortcutMsg('Only available in the desktop app.');
      return;
    }
    const result = await window.coffeeBreak.createDesktopShortcut();
    if (result.success) {
      setShortcutMsg(t('settings.saved'));
    } else {
      setShortcutMsg(result.error || 'Failed to create shortcut.');
    }
    setTimeout(() => setShortcutMsg(''), 3000);
  }, []);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (loading) {
    return (
      <main className="settings-window">
        <div className="settings-panel">
          <p className="settings-loading">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="settings-window">
      <section className="settings-panel">
        {/* Brand Welcome */}
        <div className="settings-hero">
          <div className="settings-logo">☕</div>
          <h1>{t('settings.welcome')}</h1>
          <p className="settings-tagline">{t('settings.welcomeDesc')}</p>
        </div>

        {/* Work Duration */}
        <div className="settings-field">
          <label htmlFor="workMinutes">{t('settings.workDuration')}</label>
          <div className="settings-slider-row">
            <input
              id="workMinutes"
              type="range"
              min={5}
              max={120}
              step={5}
              value={settings.workMinutes}
              onChange={(e) => update('workMinutes', Number(e.target.value))}
            />
            <span className="settings-value">
              {settings.workMinutes} {t('settings.workDurationUnit')}
            </span>
          </div>
        </div>

        {/* Break Duration */}
        <div className="settings-field">
          <label htmlFor="breakSeconds">{t('settings.breakDuration')}</label>
          <div className="settings-slider-row">
            <input
              id="breakSeconds"
              type="range"
              min={30}
              max={600}
              step={30}
              value={settings.breakSeconds}
              onChange={(e) => update('breakSeconds', Number(e.target.value))}
            />
            <span className="settings-value">
              {displayBreakMinutes(settings.breakSeconds)} {t('settings.breakDurationUnit')}
            </span>
          </div>
        </div>

        {/* Language */}
        <div className="settings-field">
          <label>{t('settings.language')}</label>
          <div className="settings-toggle-group">
            <button
              className={`settings-toggle ${settings.locale === 'en' ? 'active' : ''}`}
              onClick={() => update('locale', 'en')}
            >
              {t('settings.languageEn')}
            </button>
            <button
              className={`settings-toggle ${settings.locale === 'zh' ? 'active' : ''}`}
              onClick={() => update('locale', 'zh')}
            >
              {t('settings.languageZh')}
            </button>
          </div>
        </div>

        {/* Launch at Startup */}
        <div className="settings-field settings-checkbox">
          <label>
            <input
              type="checkbox"
              checked={settings.launchAtStartup}
              onChange={(e) => update('launchAtStartup', e.target.checked)}
            />
            <span>
              <strong>{t('settings.launchAtStartup')}</strong>
              <small>{t('settings.launchAtStartupDesc')}</small>
            </span>
          </label>
        </div>

        {/* Desktop Shortcut */}
        <div className="settings-field">
          <button className="settings-btn-secondary" onClick={handleCreateShortcut}>
            {t('settings.createShortcut')}
          </button>
          {shortcutMsg && <p className="settings-msg">{shortcutMsg}</p>}
        </div>

        {/* Save */}
        <button className="settings-btn-primary" onClick={handleSave}>
          {t('settings.save')}
        </button>
        {saved && <p className="settings-saved">{t('settings.saved')}</p>}
      </section>
    </main>
  );
}
