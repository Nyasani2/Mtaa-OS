class KernelAudit {

  records: any[] = [];

  record(action: string, actor: string, data?: any) {
    this.records.push({
      action,
      actor,
      data,
      ts: Date.now()
    });
  }

  getAuditLog() {
    return this.records;
  }
}

export const kernelAudit = new KernelAudit();
