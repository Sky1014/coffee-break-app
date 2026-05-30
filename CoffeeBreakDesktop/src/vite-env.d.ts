/// <reference types="vite/client" />

type BreakAction = 'complete' | 'snooze' | 'skip';

interface CoffeeBreakApi {
  onBreakStarted: (callback: (payload: BreakPayload) => void) => () => void;
  sendBreakAction: (action: BreakAction) => void;
  getBreakState: () => Promise<BreakPayload & { active: boolean }>;
  log: (message: string) => void;
  assetUrl: (name: string) => Promise<string>;
}

type BreakPayload = {
  durationSeconds?: number;
  startedAt?: number;
  assets?: {
    coffeePourUrl?: string;
  };
};

interface Window {
  coffeeBreak?: CoffeeBreakApi;
}
