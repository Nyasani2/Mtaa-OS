class KernelLogEngine {

  logs: any[] = [];

  info(tag: string, data?: any) {
    this.logs.push({ level: "INFO", tag, data, ts: Date.now() });
  }

  warn(tag: string, data?: any) {
    this.logs.push({ level: "WARN", tag, data, ts: Date.now() });
  }

  error(tag: string, data?: any) {
    this.logs.push({ level: "ERROR", tag, data, ts: Date.now() });
  }

  dump() {
    return this.logs;
  }
}

export const kernelLogEngine = new KernelLogEngine();
