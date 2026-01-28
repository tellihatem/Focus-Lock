/**
 * Process Monitor Service
 * Handles scanning for and terminating restricted applications
 * Uses Windows-specific commands for process management
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { RestrictedApp } from '../../shared/types';

const execAsync = promisify(exec);

/**
 * Process information from system scan
 */
export interface ProcessInfo {
  pid: number;
  name: string;
  executableName: string;
}

/**
 * Process termination result
 */
export interface TerminationResult {
  success: boolean;
  pid: number;
  processName: string;
  error?: string;
}

/**
 * Process monitor configuration
 */
export interface ProcessMonitorConfig {
  pollIntervalMs: number;
  gracefulTerminationFirst: boolean;
  maxRetries: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ProcessMonitorConfig = {
  pollIntervalMs: 1500, // 1.5 seconds
  gracefulTerminationFirst: true,
  maxRetries: 3,
};

/**
 * Process Monitor class
 * Provides methods for scanning and managing system processes
 */
export class ProcessMonitor {
  private config: ProcessMonitorConfig;
  private isMonitoring: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private onRestrictedProcessDetected: ((process: ProcessInfo) => void) | null = null;
  private onProcessTerminated: ((result: TerminationResult) => void) | null = null;

  /**
   * Initialize process monitor with optional configuration
   */
  constructor(config: Partial<ProcessMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get list of running processes
   * Uses tasklist command on Windows
   */
  async getRunningProcesses(): Promise<ProcessInfo[]> {
    try {
      // Windows tasklist command with CSV format for easier parsing
      const { stdout } = await execAsync('tasklist /FO CSV /NH', {
        windowsHide: true,
      });

      const processes: ProcessInfo[] = [];
      const lines = stdout.trim().split('\n');

      for (const line of lines) {
        // Parse CSV format: "name.exe","PID","Session Name","Session#","Mem Usage"
        const match = line.match(/"([^"]+)","(\d+)"/);
        if (match) {
          const name = match[1];
          const pid = parseInt(match[2], 10);

          processes.push({
            pid,
            name: name.replace('.exe', ''),
            executableName: name.toLowerCase(),
          });
        }
      }

      return processes;
    } catch (error) {
      console.error('Failed to get running processes:', error);
      return [];
    }
  }

  /**
   * Check if any restricted apps are running
   */
  async detectRestrictedProcesses(restrictedApps: RestrictedApp[]): Promise<ProcessInfo[]> {
    const runningProcesses = await this.getRunningProcesses();
    const enabledApps = restrictedApps.filter((app) => app.isEnabled);

    const detected: ProcessInfo[] = [];

    for (const process of runningProcesses) {
      for (const app of enabledApps) {
        if (process.executableName === app.executableName.toLowerCase()) {
          detected.push(process);
          break;
        }
      }
    }

    return detected;
  }

  /**
   * Terminate a process by PID
   * Uses taskkill command on Windows
   */
  async terminateProcess(pid: number, processName: string): Promise<TerminationResult> {
    try {
      if (this.config.gracefulTerminationFirst) {
        // Try graceful termination first
        try {
          await execAsync(`taskkill /PID ${pid}`, { windowsHide: true });
          return { success: true, pid, processName };
        } catch {
          // Graceful failed, try force kill
        }
      }

      // Force kill
      await execAsync(`taskkill /PID ${pid} /F`, { windowsHide: true });
      return { success: true, pid, processName };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to terminate process ${processName} (PID: ${pid}):`, errorMessage);
      return {
        success: false,
        pid,
        processName,
        error: errorMessage,
      };
    }
  }

  /**
   * Terminate all instances of restricted processes
   */
  async terminateRestrictedProcesses(restrictedApps: RestrictedApp[]): Promise<TerminationResult[]> {
    const detectedProcesses = await this.detectRestrictedProcesses(restrictedApps);
    const results: TerminationResult[] = [];

    for (const process of detectedProcesses) {
      const result = await this.terminateProcess(process.pid, process.name);
      results.push(result);

      if (this.onProcessTerminated) {
        this.onProcessTerminated(result);
      }
    }

    return results;
  }

  /**
   * Start monitoring for restricted processes
   */
  startMonitoring(
    restrictedApps: RestrictedApp[],
    onDetected?: (process: ProcessInfo) => void,
    onTerminated?: (result: TerminationResult) => void
  ): void {
    if (this.isMonitoring) {
      console.warn('Process monitor is already running');
      return;
    }

    this.isMonitoring = true;
    this.onRestrictedProcessDetected = onDetected || null;
    this.onProcessTerminated = onTerminated || null;

    const poll = async () => {
      if (!this.isMonitoring) return;

      const detected = await this.detectRestrictedProcesses(restrictedApps);

      for (const process of detected) {
        if (this.onRestrictedProcessDetected) {
          this.onRestrictedProcessDetected(process);
        }

        // Terminate the process
        const result = await this.terminateProcess(process.pid, process.name);

        if (this.onProcessTerminated) {
          this.onProcessTerminated(result);
        }
      }

      // Schedule next poll
      if (this.isMonitoring) {
        this.pollTimer = setTimeout(poll, this.config.pollIntervalMs);
      }
    };

    // Start polling
    poll();
  }

  /**
   * Stop monitoring for restricted processes
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    this.onRestrictedProcessDetected = null;
    this.onProcessTerminated = null;
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Update poll interval
   */
  setPollInterval(intervalMs: number): void {
    this.config.pollIntervalMs = Math.max(500, intervalMs); // Minimum 500ms
  }

  /**
   * Get current configuration
   */
  getConfig(): ProcessMonitorConfig {
    return { ...this.config };
  }
}

/**
 * Singleton instance for global access
 */
let processMonitorInstance: ProcessMonitor | null = null;

/**
 * Get or create the process monitor instance
 */
export function getProcessMonitor(config?: Partial<ProcessMonitorConfig>): ProcessMonitor {
  if (!processMonitorInstance) {
    processMonitorInstance = new ProcessMonitor(config);
  }
  return processMonitorInstance;
}

/**
 * Reset the process monitor instance (for testing)
 */
export function resetProcessMonitor(): void {
  if (processMonitorInstance) {
    processMonitorInstance.stopMonitoring();
    processMonitorInstance = null;
  }
}
