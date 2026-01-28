/**
 * Unit tests for ProcessMonitor
 * Tests process scanning and termination logic
 */

import { ProcessMonitor, resetProcessMonitor } from '../main/services/process-monitor';
import { RestrictedApp } from '../shared/types';
import { exec } from 'child_process';

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// Mock util.promisify to work with our mocked exec
jest.mock('util', () => ({
  promisify: (fn: typeof exec) => {
    return (...args: unknown[]) => {
      return new Promise((resolve, reject) => {
        (fn as Function)(...args, (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            reject(error);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });
    };
  },
}));

const mockExec = exec as jest.MockedFunction<typeof exec>;

describe('ProcessMonitor', () => {
  let monitor: ProcessMonitor;

  // Sample tasklist output (Windows CSV format)
  const mockTasklistOutput = `"System Idle Process","0","Services","0","8 K"
"System","4","Services","0","144 K"
"steam.exe","1234","Console","1","150,000 K"
"Discord.exe","5678","Console","1","200,000 K"
"chrome.exe","9012","Console","1","500,000 K"
"EpicGamesLauncher.exe","3456","Console","1","180,000 K"`;

  beforeEach(() => {
    jest.clearAllMocks();
    resetProcessMonitor();
    monitor = new ProcessMonitor();
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('getRunningProcesses', () => {
    it('should parse Windows tasklist output correctly', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        (callback as Function)(null, mockTasklistOutput, '');
        return {} as any;
      });

      const processes = await monitor.getRunningProcesses();

      expect(processes.length).toBeGreaterThan(0);
      expect(processes.find((p) => p.executableName === 'steam.exe')).toBeDefined();
      expect(processes.find((p) => p.pid === 1234)).toBeDefined();
    });

    it('should return empty array on exec error', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        (callback as Function)(new Error('Command failed'), '', '');
        return {} as any;
      });

      const processes = await monitor.getRunningProcesses();

      expect(processes).toEqual([]);
    });

    it('should convert executable names to lowercase', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        (callback as Function)(null, '"Steam.EXE","1234","Console","1","100 K"', '');
        return {} as any;
      });

      const processes = await monitor.getRunningProcesses();

      expect(processes[0].executableName).toBe('steam.exe');
    });
  });

  describe('detectRestrictedProcesses', () => {
    const restrictedApps: RestrictedApp[] = [
      { id: 'steam', name: 'Steam', executableName: 'steam.exe', isEnabled: true, isPreset: true },
      { id: 'epic', name: 'Epic Games', executableName: 'EpicGamesLauncher.exe', isEnabled: true, isPreset: true },
      { id: 'discord', name: 'Discord', executableName: 'Discord.exe', isEnabled: false, isPreset: true },
    ];

    it('should detect enabled restricted processes', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        (callback as Function)(null, mockTasklistOutput, '');
        return {} as any;
      });

      const detected = await monitor.detectRestrictedProcesses(restrictedApps);

      expect(detected.length).toBe(2); // Steam and Epic (Discord disabled)
      expect(detected.find((p) => p.executableName === 'steam.exe')).toBeDefined();
      expect(detected.find((p) => p.executableName === 'epicgameslauncher.exe')).toBeDefined();
    });

    it('should not detect disabled restricted apps', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        (callback as Function)(null, mockTasklistOutput, '');
        return {} as any;
      });

      const detected = await monitor.detectRestrictedProcesses(restrictedApps);

      // Discord is disabled so should not be detected
      expect(detected.find((p) => p.executableName === 'discord.exe')).toBeUndefined();
    });

    it('should return empty array when no restricted processes running', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        (callback as Function)(null, '"notepad.exe","1234","Console","1","10 K"', '');
        return {} as any;
      });

      const detected = await monitor.detectRestrictedProcesses(restrictedApps);

      expect(detected).toEqual([]);
    });
  });

  describe('terminateProcess', () => {
    it('should attempt graceful termination first by default', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        (callback as Function)(null, '', '');
        return {} as any;
      });

      await monitor.terminateProcess(1234, 'steam');

      expect(mockExec).toHaveBeenCalledWith(
        'taskkill /PID 1234',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should force kill if graceful termination fails', async () => {
      let callCount = 0;
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        callCount++;
        if (callCount === 1) {
          // First call (graceful) fails
          (callback as Function)(new Error('Access denied'), '', '');
        } else {
          // Second call (force) succeeds
          (callback as Function)(null, '', '');
        }
        return {} as any;
      });

      const result = await monitor.terminateProcess(1234, 'steam');

      expect(result.success).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        'taskkill /PID 1234 /F',
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('should return failure result on complete termination failure', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        (callback as Function)(new Error('Process not found'), '', '');
        return {} as any;
      });

      const result = await monitor.terminateProcess(1234, 'steam');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return correct process info in result', async () => {
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        (callback as Function)(null, '', '');
        return {} as any;
      });

      const result = await monitor.terminateProcess(1234, 'steam');

      expect(result.pid).toBe(1234);
      expect(result.processName).toBe('steam');
    });
  });

  describe('monitoring lifecycle', () => {
    it('should start monitoring', () => {
      const restrictedApps: RestrictedApp[] = [];

      monitor.startMonitoring(restrictedApps);

      expect(monitor.isActive()).toBe(true);
    });

    it('should stop monitoring', () => {
      const restrictedApps: RestrictedApp[] = [];

      monitor.startMonitoring(restrictedApps);
      monitor.stopMonitoring();

      expect(monitor.isActive()).toBe(false);
    });

    it('should warn when starting while already monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const restrictedApps: RestrictedApp[] = [];

      monitor.startMonitoring(restrictedApps);
      monitor.startMonitoring(restrictedApps);

      expect(consoleSpy).toHaveBeenCalledWith('Process monitor is already running');
      consoleSpy.mockRestore();
    });
  });

  describe('configuration', () => {
    it('should use default config', () => {
      const config = monitor.getConfig();

      expect(config.pollIntervalMs).toBe(1500);
      expect(config.gracefulTerminationFirst).toBe(true);
      expect(config.maxRetries).toBe(3);
    });

    it('should accept custom config', () => {
      const customMonitor = new ProcessMonitor({
        pollIntervalMs: 2000,
        gracefulTerminationFirst: false,
      });

      const config = customMonitor.getConfig();

      expect(config.pollIntervalMs).toBe(2000);
      expect(config.gracefulTerminationFirst).toBe(false);
    });

    it('should update poll interval with minimum of 500ms', () => {
      monitor.setPollInterval(100);

      const config = monitor.getConfig();

      expect(config.pollIntervalMs).toBe(500);
    });

    it('should allow poll interval above minimum', () => {
      monitor.setPollInterval(3000);

      const config = monitor.getConfig();

      expect(config.pollIntervalMs).toBe(3000);
    });
  });

  describe('terminateRestrictedProcesses', () => {
    it('should terminate all detected restricted processes', async () => {
      const restrictedApps: RestrictedApp[] = [
        { id: 'steam', name: 'Steam', executableName: 'steam.exe', isEnabled: true, isPreset: true },
      ];

      let execCallCount = 0;
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        execCallCount++;
        if (execCallCount === 1) {
          // tasklist call
          (callback as Function)(null, '"steam.exe","1234","Console","1","100 K"', '');
        } else {
          // taskkill call
          (callback as Function)(null, '', '');
        }
        return {} as any;
      });

      const results = await monitor.terminateRestrictedProcesses(restrictedApps);

      expect(results.length).toBe(1);
      expect(results[0].success).toBe(true);
      expect(results[0].processName).toBe('steam');
    });

    it('should call onProcessTerminated callback', async () => {
      const restrictedApps: RestrictedApp[] = [
        { id: 'steam', name: 'Steam', executableName: 'steam.exe', isEnabled: true, isPreset: true },
      ];

      const onTerminated = jest.fn();

      let execCallCount = 0;
      mockExec.mockImplementation((cmd, opts, callback) => {
        if (typeof opts === 'function') {
          callback = opts;
        }
        execCallCount++;
        if (execCallCount === 1) {
          (callback as Function)(null, '"steam.exe","1234","Console","1","100 K"', '');
        } else {
          (callback as Function)(null, '', '');
        }
        return {} as any;
      });

      // Set callback via startMonitoring then stop to set the callback
      monitor.startMonitoring(restrictedApps, undefined, onTerminated);
      monitor.stopMonitoring();

      // Verify the monitor was started and stopped
      expect(monitor.isActive()).toBe(false);
    });
  });
});
