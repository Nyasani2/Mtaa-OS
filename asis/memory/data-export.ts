/**
 * ASIS Layer 4 — Data Export Engine
 * User-owned data export in multiple formats
 */

import { DataExportRequest, ExportFormat, MemoryEntry, ContextScope } from '../types';
import { MemoryEngine } from './memory-engine';

export class DataExportEngine {
  private memoryEngine: MemoryEngine;

  constructor(memoryEngine: MemoryEngine) {
    this.memoryEngine = memoryEngine;
  }

  async processExport(request: DataExportRequest): Promise<DataExportRequest> {
    request.status = 'processing';

    try {
      const scopes = request.scopes.map(s => s as ContextScope);
      const memories = await this.memoryEngine.export(scopes);

      const exports: Record<string, string> = {};

      for (const format of request.formats) {
        exports[format] = await this.formatData(memories, format);
      }

      // Create downloadable blob
      const blob = await this.createZip(exports);
      request.downloadUrl = URL.createObjectURL(blob);
      request.sizeBytes = blob.size;
      request.status = 'ready';
      request.expiresAt = new Date(Date.now() + 7 * 86400000); // 7 days

    } catch (error) {
      request.status = 'failed';
      throw error;
    }

    return request;
  }

  private async formatData(data: Record<string, unknown>, format: ExportFormat): Promise<string> {
    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(data, null, 2);

      case ExportFormat.CSV:
        return this.toCSV(data);

      case ExportFormat.PDF:
        return this.toPDF(data);

      case ExportFormat.SQLITE:
        return this.toSQLite(data);

      default:
        return JSON.stringify(data);
    }
  }

  private toCSV(data: Record<string, unknown>): string {
    const rows: string[] = ['layer,key,value,scope,created_at,confidence,tags'];

    for (const [layer, entries] of Object.entries(data)) {
      if (layer === 'userId' || layer === 'exportedAt' || layer === 'version') continue;

      for (const entry of entries as MemoryEntry[]) {
        rows.push([
          layer,
          entry.key,
          JSON.stringify(entry.value).replace(/,/g, ';'),
          entry.contextScope,
          entry.createdAt.toISOString(),
          entry.confidence.toString(),
          entry.tags.join(';'),
        ].join(','));
      }
    }

    return rows.join('\n');
  }

  private toPDF(data: Record<string, unknown>): string {
    // Return HTML that can be printed to PDF
    let html = `
      <html>
      <head><title>ASIS Data Export</title></head>
      <body>
      <h1>Your ASIS Data Export</h1>
      <p>Exported: ${(data as any).exportedAt}</p>
      <hr/>
    `;

    for (const [layer, entries] of Object.entries(data)) {
      if (typeof entries !== 'object') continue;
      html += `<h2>${layer}</h2><table border="1">`;
      html += '<tr><th>Key</th><th>Value</th><th>Scope</th><th>Created</th></tr>';

      for (const entry of entries as MemoryEntry[]) {
        html += `<tr>
          <td>${entry.key}</td>
          <td>${JSON.stringify(entry.value)}</td>
          <td>${entry.contextScope}</td>
          <td>${entry.createdAt.toISOString()}</td>
        </tr>`;
      }
      html += '</table>';
    }

    html += '</body></html>';
    return html;
  }

  private toSQLite(data: Record<string, unknown>): string {
    // Return SQL dump for SQLite import
    let sql = `
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        layer TEXT,
        key TEXT,
        value TEXT,
        scope TEXT,
        created_at TEXT,
        confidence REAL,
        tags TEXT
      );
    `;

    for (const [layer, entries] of Object.entries(data)) {
      if (typeof entries !== 'object') continue;

      for (const entry of entries as MemoryEntry[]) {
        sql += `INSERT INTO memories VALUES (
          '${entry.id}',
          '${layer}',
          '${entry.key}',
          '${JSON.stringify(entry.value).replace(/'/g, "''")}',
          '${entry.contextScope}',
          '${entry.createdAt.toISOString()}',
          ${entry.confidence},
          '${entry.tags.join(',')}'
        );\n`;
      }
    }

    return sql;
  }

  private async createZip(files: Record<string, string>): Promise<Blob> {
    // For MVP: return a JSON blob with all formats
    // In production: use JSZip or similar
    const combined = JSON.stringify(files, null, 2);
    return new Blob([combined], { type: 'application/json' });
  }
}
