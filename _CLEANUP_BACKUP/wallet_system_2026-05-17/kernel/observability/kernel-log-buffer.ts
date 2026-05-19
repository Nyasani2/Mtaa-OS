export interface KernelLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
}

export class KernelLogBuffer {
  private logs: KernelLog[] = [];

  push(log: KernelLog) {
    this.logs.push(log);

    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }

  format(log: KernelLog) {
    return [
      '[' + String(log.level).toUpperCase() + ']',
      log.message,
      log.timestamp,
    ].join(' ');
  }
}

export const kernelLogBuffer = new KernelLogBuffer();
