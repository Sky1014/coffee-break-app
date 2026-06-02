/// <reference types="vite/client" />

type BreakAction = 'complete' | 'snooze' | 'skip';

interface CoffeeBreakApi {
  onBreakStarted: (callback: (payload: BreakPayload) => void) => () => void;
  sendBreakAction: (action: BreakAction) => void;
  getBreakState: () => Promise<BreakPayload & { active: boolean }>;
  log: (message: string) => void;
  assetUrl: (name: string) => Promise<string>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  onSettingsChanged: (callback: (settings: AppSettings) => void) => () => void;
  createDesktopShortcut: () => Promise<{ success: boolean; error?: string }>;
}

type BreakPayload = {
  durationSeconds?: number;
  startedAt?: number;
  assets?: {
    coffeePourUrl?: string;
  };
};

type AppSettings = {
  workMinutes: number;
  breakSeconds: number;
  launchAtStartup: boolean;
  locale: 'en' | 'zh';
};

interface Window {
  coffeeBreak?: CoffeeBreakApi;
}

declare module '*.json' {
  const value: Record<string, string>;
  export default value;
}
