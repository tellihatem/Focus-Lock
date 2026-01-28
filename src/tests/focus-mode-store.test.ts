/**
 * Unit tests for FocusModeStore (Zustand)
 * Tests state management for Focus Mode
 */

import { useFocusModeStore } from '../renderer/stores/focus-mode-store';

describe('FocusModeStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useFocusModeStore.getState().resetFocusMode();
    // Reset restricted apps to defaults
    useFocusModeStore.setState({
      restrictedApps: [
        { id: 'steam', name: 'Steam', executableName: 'steam.exe', isEnabled: true, isPreset: true },
        { id: 'epic', name: 'Epic Games', executableName: 'EpicGamesLauncher.exe', isEnabled: true, isPreset: true },
        { id: 'discord', name: 'Discord', executableName: 'Discord.exe', isEnabled: false, isPreset: true },
      ],
      sessions: [],
      totalFocusTime: 0,
    });
  });

  describe('startFocusMode', () => {
    it('should activate focus mode', () => {
      const { startFocusMode } = useFocusModeStore.getState();

      startFocusMode();

      const { isActive } = useFocusModeStore.getState();
      expect(isActive).toBe(true);
    });

    it('should set startedAt timestamp', () => {
      const { startFocusMode } = useFocusModeStore.getState();
      const before = Date.now();

      startFocusMode();

      const { startedAt } = useFocusModeStore.getState();
      expect(startedAt).toBeGreaterThanOrEqual(before);
    });

    it('should reset currentSessionTime to 0', () => {
      const { startFocusMode } = useFocusModeStore.getState();

      startFocusMode();

      const { currentSessionTime } = useFocusModeStore.getState();
      expect(currentSessionTime).toBe(0);
    });
  });

  describe('stopFocusMode', () => {
    it('should deactivate focus mode', () => {
      const { startFocusMode, stopFocusMode } = useFocusModeStore.getState();

      startFocusMode();
      stopFocusMode(true, 5);

      const { isActive } = useFocusModeStore.getState();
      expect(isActive).toBe(false);
    });

    it('should clear startedAt', () => {
      const { startFocusMode, stopFocusMode } = useFocusModeStore.getState();

      startFocusMode();
      stopFocusMode(true, 5);

      const { startedAt } = useFocusModeStore.getState();
      expect(startedAt).toBeNull();
    });

    it('should record session in history', () => {
      const { startFocusMode, stopFocusMode } = useFocusModeStore.getState();

      startFocusMode();
      stopFocusMode(true, 3);

      const { sessions } = useFocusModeStore.getState();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].tasksCompleted).toBe(3);
      expect(sessions[0].wasUnlockedNaturally).toBe(true);
    });

    it('should accumulate total focus time', () => {
      const { startFocusMode, stopFocusMode } = useFocusModeStore.getState();

      startFocusMode();
      // Manually set startedAt to simulate time passing
      useFocusModeStore.setState({ startedAt: Date.now() - 60000 }); // 1 minute ago
      stopFocusMode(true, 1);

      const { totalFocusTime } = useFocusModeStore.getState();
      expect(totalFocusTime).toBeGreaterThanOrEqual(60000);
    });
  });

  describe('updateSessionTime', () => {
    it('should update currentSessionTime when active', () => {
      const { startFocusMode, updateSessionTime } = useFocusModeStore.getState();

      startFocusMode();
      // Set startedAt to 5 seconds ago
      useFocusModeStore.setState({ startedAt: Date.now() - 5000 });
      updateSessionTime();

      const { currentSessionTime } = useFocusModeStore.getState();
      expect(currentSessionTime).toBeGreaterThanOrEqual(5000);
    });

    it('should not update when not active', () => {
      const { updateSessionTime } = useFocusModeStore.getState();

      updateSessionTime();

      const { currentSessionTime } = useFocusModeStore.getState();
      expect(currentSessionTime).toBe(0);
    });
  });

  describe('Restricted Apps Management', () => {
    it('should add a custom restricted app', () => {
      const { addRestrictedApp } = useFocusModeStore.getState();

      addRestrictedApp({
        name: 'Custom Game',
        executableName: 'game.exe',
        isEnabled: true,
      });

      const { restrictedApps } = useFocusModeStore.getState();
      const customApp = restrictedApps.find((app) => app.name === 'Custom Game');
      expect(customApp).toBeDefined();
      expect(customApp?.isPreset).toBe(false);
    });

    it('should toggle restricted app enabled state', () => {
      const { toggleRestrictedApp } = useFocusModeStore.getState();

      toggleRestrictedApp('steam');

      const { restrictedApps } = useFocusModeStore.getState();
      const steam = restrictedApps.find((app) => app.id === 'steam');
      expect(steam?.isEnabled).toBe(false);
    });

    it('should remove non-preset apps only', () => {
      const { addRestrictedApp, removeRestrictedApp } = useFocusModeStore.getState();

      addRestrictedApp({
        name: 'Custom Game',
        executableName: 'game.exe',
        isEnabled: true,
      });

      const customAppId = useFocusModeStore.getState().restrictedApps.find(
        (app) => app.name === 'Custom Game'
      )?.id;

      removeRestrictedApp(customAppId!);

      const { restrictedApps } = useFocusModeStore.getState();
      expect(restrictedApps.find((app) => app.name === 'Custom Game')).toBeUndefined();
    });

    it('should not remove preset apps', () => {
      const { removeRestrictedApp } = useFocusModeStore.getState();

      removeRestrictedApp('steam');

      const { restrictedApps } = useFocusModeStore.getState();
      expect(restrictedApps.find((app) => app.id === 'steam')).toBeDefined();
    });

    it('should get enabled restricted apps', () => {
      const { getEnabledRestrictedApps } = useFocusModeStore.getState();

      const enabled = useFocusModeStore.getState().getEnabledRestrictedApps();

      expect(enabled.every((app) => app.isEnabled)).toBe(true);
      expect(enabled.length).toBe(2); // Steam and Epic are enabled by default
    });
  });

  describe('Emergency Unlock', () => {
    it('should allow emergency unlock when no previous unlock', () => {
      const { startFocusMode, canEmergencyUnlock } = useFocusModeStore.getState();

      startFocusMode();

      expect(useFocusModeStore.getState().canEmergencyUnlock()).toBe(true);
    });

    it('should perform emergency unlock and stop focus mode', () => {
      const { startFocusMode, emergencyUnlock } = useFocusModeStore.getState();

      startFocusMode();
      const result = emergencyUnlock();

      expect(result).toBe(true);
      expect(useFocusModeStore.getState().isActive).toBe(false);
    });

    it('should set lastEmergencyUnlock timestamp', () => {
      const { startFocusMode, emergencyUnlock } = useFocusModeStore.getState();

      startFocusMode();
      emergencyUnlock();

      const { lastEmergencyUnlock } = useFocusModeStore.getState();
      expect(lastEmergencyUnlock).not.toBeNull();
    });

    it('should prevent emergency unlock during cooldown', () => {
      const { startFocusMode, emergencyUnlock, canEmergencyUnlock } = useFocusModeStore.getState();

      startFocusMode();
      emergencyUnlock();

      // Start again
      startFocusMode();

      expect(useFocusModeStore.getState().canEmergencyUnlock()).toBe(false);
    });

    it('should return false when not in focus mode', () => {
      const { canEmergencyUnlock } = useFocusModeStore.getState();

      expect(canEmergencyUnlock()).toBe(false);
    });

    it('should calculate cooldown remaining correctly', () => {
      const { startFocusMode, emergencyUnlock, getEmergencyUnlockCooldownRemaining } =
        useFocusModeStore.getState();

      startFocusMode();
      emergencyUnlock();

      const remaining = useFocusModeStore.getState().getEmergencyUnlockCooldownRemaining();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30 * 60 * 1000); // 30 minutes
    });
  });

  describe('getTotalFocusTimeFormatted', () => {
    it('should format time in minutes when under 1 hour', () => {
      useFocusModeStore.setState({ totalFocusTime: 25 * 60 * 1000 }); // 25 minutes

      const formatted = useFocusModeStore.getState().getTotalFocusTimeFormatted();

      expect(formatted).toBe('25m');
    });

    it('should format time in hours and minutes', () => {
      useFocusModeStore.setState({ totalFocusTime: 90 * 60 * 1000 }); // 90 minutes

      const formatted = useFocusModeStore.getState().getTotalFocusTimeFormatted();

      expect(formatted).toBe('1h 30m');
    });

    it('should include current session time', () => {
      useFocusModeStore.setState({
        totalFocusTime: 30 * 60 * 1000, // 30 minutes
        currentSessionTime: 15 * 60 * 1000, // 15 minutes
      });

      const formatted = useFocusModeStore.getState().getTotalFocusTimeFormatted();

      expect(formatted).toBe('45m');
    });
  });

  describe('getSessionHistory', () => {
    it('should return all sessions', () => {
      const { startFocusMode, stopFocusMode, getSessionHistory } = useFocusModeStore.getState();

      startFocusMode();
      stopFocusMode(true, 2);
      startFocusMode();
      stopFocusMode(false, 0);

      const history = useFocusModeStore.getState().getSessionHistory();

      expect(history).toHaveLength(2);
    });
  });

  describe('resetFocusMode', () => {
    it('should reset active state', () => {
      const { startFocusMode, resetFocusMode } = useFocusModeStore.getState();

      startFocusMode();
      resetFocusMode();

      const { isActive, startedAt, currentSessionTime } = useFocusModeStore.getState();
      expect(isActive).toBe(false);
      expect(startedAt).toBeNull();
      expect(currentSessionTime).toBe(0);
    });
  });
});
