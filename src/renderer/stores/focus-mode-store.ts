/**
 * Zustand store for Focus Mode state management
 * Provides reactive state for Focus Mode with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FocusModeState, RestrictedApp, FocusSession } from '../../shared/types';

/**
 * Default restricted apps presets
 */
const DEFAULT_RESTRICTED_APPS: RestrictedApp[] = [
  { id: 'steam', name: 'Steam', executableName: 'steam.exe', isEnabled: true, isPreset: true },
  { id: 'epic', name: 'Epic Games', executableName: 'EpicGamesLauncher.exe', isEnabled: true, isPreset: true },
  { id: 'discord', name: 'Discord', executableName: 'Discord.exe', isEnabled: false, isPreset: true },
  { id: 'spotify', name: 'Spotify', executableName: 'Spotify.exe', isEnabled: false, isPreset: true },
];

/**
 * Focus mode store state interface
 */
interface FocusModeStoreState {
  // Focus mode state
  isActive: boolean;
  startedAt: number | null;
  totalFocusTime: number;
  currentSessionTime: number;
  
  // Restricted apps
  restrictedApps: RestrictedApp[];
  
  // Session history
  sessions: FocusSession[];
  
  // Emergency unlock
  lastEmergencyUnlock: number | null;
  emergencyUnlockCooldown: number; // in milliseconds (default 30 min)
}

/**
 * Focus mode store actions interface
 */
interface FocusModeActions {
  // Focus mode controls
  startFocusMode: () => void;
  stopFocusMode: (wasNatural: boolean, tasksCompleted: number) => void;
  updateSessionTime: () => void;
  
  // Restricted apps management
  addRestrictedApp: (app: Omit<RestrictedApp, 'id' | 'isPreset'>) => void;
  removeRestrictedApp: (id: string) => void;
  toggleRestrictedApp: (id: string) => void;
  updateRestrictedApp: (id: string, updates: Partial<RestrictedApp>) => void;
  
  // Emergency unlock
  emergencyUnlock: () => boolean;
  canEmergencyUnlock: () => boolean;
  getEmergencyUnlockCooldownRemaining: () => number;
  
  // Queries
  getEnabledRestrictedApps: () => RestrictedApp[];
  getTotalFocusTimeFormatted: () => string;
  getSessionHistory: () => FocusSession[];
  
  // State management
  resetFocusMode: () => void;
}

/**
 * Combined store type
 */
export type FocusModeStore = FocusModeStoreState & FocusModeActions;

/**
 * Generate unique ID
 */
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format milliseconds to human readable time
 */
const formatTime = (ms: number): string => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Focus mode store instance with localStorage persistence
 */
export const useFocusModeStore = create<FocusModeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isActive: false,
      startedAt: null,
      totalFocusTime: 0,
      currentSessionTime: 0,
      restrictedApps: DEFAULT_RESTRICTED_APPS,
      sessions: [],
      lastEmergencyUnlock: null,
      emergencyUnlockCooldown: 30 * 60 * 1000, // 30 minutes

      /**
       * Start focus mode session
       */
      startFocusMode: (): void => {
        const now = Date.now();
        set({
          isActive: true,
          startedAt: now,
          currentSessionTime: 0,
        });
      },

      /**
       * Stop focus mode and record session
       */
      stopFocusMode: (wasNatural: boolean, tasksCompleted: number): void => {
        const { startedAt, currentSessionTime, sessions, totalFocusTime } = get();
        
        if (!startedAt) return;

        const now = Date.now();
        const duration = now - startedAt;

        const newSession: FocusSession = {
          id: generateId(),
          startedAt,
          endedAt: now,
          duration,
          tasksCompleted,
          wasUnlockedNaturally: wasNatural,
        };

        set({
          isActive: false,
          startedAt: null,
          currentSessionTime: 0,
          totalFocusTime: totalFocusTime + duration,
          sessions: [...sessions, newSession],
        });
      },

      /**
       * Update current session time (called periodically)
       */
      updateSessionTime: (): void => {
        const { isActive, startedAt } = get();
        
        if (!isActive || !startedAt) return;

        const now = Date.now();
        set({
          currentSessionTime: now - startedAt,
        });
      },

      /**
       * Add a custom restricted app
       */
      addRestrictedApp: (app: Omit<RestrictedApp, 'id' | 'isPreset'>): void => {
        const newApp: RestrictedApp = {
          ...app,
          id: generateId(),
          isPreset: false,
        };

        set((state) => ({
          restrictedApps: [...state.restrictedApps, newApp],
        }));
      },

      /**
       * Remove a restricted app (only non-presets)
       */
      removeRestrictedApp: (id: string): void => {
        set((state) => ({
          restrictedApps: state.restrictedApps.filter(
            (app) => app.id !== id || app.isPreset
          ),
        }));
      },

      /**
       * Toggle a restricted app enabled state
       */
      toggleRestrictedApp: (id: string): void => {
        set((state) => ({
          restrictedApps: state.restrictedApps.map((app) =>
            app.id === id ? { ...app, isEnabled: !app.isEnabled } : app
          ),
        }));
      },

      /**
       * Update a restricted app
       */
      updateRestrictedApp: (id: string, updates: Partial<RestrictedApp>): void => {
        set((state) => ({
          restrictedApps: state.restrictedApps.map((app) =>
            app.id === id ? { ...app, ...updates } : app
          ),
        }));
      },

      /**
       * Emergency unlock - bypasses focus mode with cooldown penalty
       */
      emergencyUnlock: (): boolean => {
        const { canEmergencyUnlock, stopFocusMode } = get();
        
        if (!canEmergencyUnlock()) {
          return false;
        }

        stopFocusMode(false, 0);
        set({ lastEmergencyUnlock: Date.now() });
        return true;
      },

      /**
       * Check if emergency unlock is available
       */
      canEmergencyUnlock: (): boolean => {
        const { lastEmergencyUnlock, emergencyUnlockCooldown, isActive } = get();
        
        if (!isActive) return false;
        if (!lastEmergencyUnlock) return true;
        
        return Date.now() - lastEmergencyUnlock >= emergencyUnlockCooldown;
      },

      /**
       * Get remaining cooldown time for emergency unlock
       */
      getEmergencyUnlockCooldownRemaining: (): number => {
        const { lastEmergencyUnlock, emergencyUnlockCooldown } = get();
        
        if (!lastEmergencyUnlock) return 0;
        
        const elapsed = Date.now() - lastEmergencyUnlock;
        return Math.max(0, emergencyUnlockCooldown - elapsed);
      },

      /**
       * Get all enabled restricted apps
       */
      getEnabledRestrictedApps: (): RestrictedApp[] => {
        return get().restrictedApps.filter((app) => app.isEnabled);
      },

      /**
       * Get total focus time formatted
       */
      getTotalFocusTimeFormatted: (): string => {
        const { totalFocusTime, currentSessionTime } = get();
        return formatTime(totalFocusTime + currentSessionTime);
      },

      /**
       * Get session history
       */
      getSessionHistory: (): FocusSession[] => {
        return get().sessions;
      },

      /**
       * Reset focus mode state
       */
      resetFocusMode: (): void => {
        set({
          isActive: false,
          startedAt: null,
          currentSessionTime: 0,
          lastEmergencyUnlock: null,
        });
      },
    }),
    {
      name: 'focus-lock-focus-mode',
      partialize: (state) => ({
        isActive: state.isActive,
        startedAt: state.startedAt,
        totalFocusTime: state.totalFocusTime,
        restrictedApps: state.restrictedApps,
        sessions: state.sessions,
        lastEmergencyUnlock: state.lastEmergencyUnlock,
      }),
    }
  )
);
