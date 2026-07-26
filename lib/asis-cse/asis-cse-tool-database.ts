/**
 * ASIS CSE — Database Tool
 * Supabase query execution for the cognitive architecture
 * Natural language to structured queries, safe execution, schema introspection
 * Wires into ActionEngine + EvidenceEngine
 */

import { BaseCognitiveTool, ToolExecutionRequest } from './asis-cse-tool-types';

// Supabase client type — user provides their instance
interface SupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => any;
    insert: (values: any) => any;
    update: (values: any) => any;
    delete: () => any;
    eq: (column: string, value: any) => any;
    neq: (column: string, value: any) => any;
    gt: (column: string, value: any) => any;
    gte: (column: string, value: any) => any;
    lt: (column: string, value: any) => any;
    lte: (column: string, value: any) => any;
    like: (column: string, pattern: string) => any;
    ilike: (column: string, pattern: string) => any;
    in: (column: string, values: any[]) => any;
    is: (column: string, value: any) => any;
    order: (column: string, options?: { ascending?: boolean }) => any;
    limit: (count: number) => any;
    range: (from: number, to: number) => any;
    single: () => any;
    maybeSingle: () => any;
    then: (onfulfilled?: any, onrejected?: any) => Promise<any>;
  };
  rpc: (fn: string, params?: any) => Promise<any>;
}

interface DatabaseQueryOptions {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  columns?: string;
  values?: any;
  filters?: Array<{ column: string; operator: string; value: any }>;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
  single?: boolean;
}

interface DatabaseQueryResult {
  data: any;
  count?: number;
  error?: string;
  query: string;
  executionTimeMs: number;
}

interface DatabaseSchemaResult {
  tables: Array<{
    name: string;
    columns: Array<{ name: string; type: string; nullable: boolean; default?: string }>;
    rowCount?: number;
  }>;
  totalTables: number;
}

interface DatabaseSearchOptions {
  table: string;
  searchColumn: string;
  searchTerm: string;
  limit?: number;
  columns?: string;
}

export class DatabaseTool extends BaseCognitiveTool {
  readonly name = 'database';
  readonly description = 'Executes Supabase database queries, performs schema introspection, and searches records safely';
  readonly version = '2.0.0';
  readonly requiresNetwork = true;
  readonly requiresFilesystem = false;
  readonly sandboxed = true;

  readonly capabilities = [
    {
      name: 'query',
      description: 'Execute a structured database query on any table',
      parameters: [
        { name: 'table', type: 'string', description: 'Table name', required: true },
        { name: 'operation', type: 'string', description: 'Query operation', required: true, enum: ['select', 'insert', 'update', 'delete', 'upsert'] },
        { name: 'columns', type: 'string', description: 'Columns to select (e.g., "*" or "id,name")', required: false, default: '*' },
        { name: 'values', type: 'object', description: 'Values for insert/update/upsert', required: false },
        { name: 'filters', type: 'array', description: 'Filter conditions [{column, operator, value}]', required: false },
        { name: 'orderBy', type: 'object', description: 'Sort order {column, ascending}', required: false },
        { name: 'limit', type: 'number', description: 'Max rows to return', required: false, default: 100 },
        { name: 'offset', type: 'number', description: 'Row offset for pagination', required: false, default: 0 },
        { name: 'single', type: 'boolean', description: 'Return single row only', required: false, default: false },
      ],
      returns: { type: 'object', description: 'DatabaseQueryResult with data, count, and metadata' },
    },
    {
      name: 'schema',
      description: 'Introspect database schema — list tables, columns, and types',
      parameters: [
        { name: 'table', type: 'string', description: 'Specific table to introspect (omit for all)', required: false },
      ],
      returns: { type: 'object', description: 'DatabaseSchemaResult with table/column metadata' },
    },
    {
      name: 'search',
      description: 'Search records in a table using pattern matching',
      parameters: [
        { name: 'table', type: 'string', description: 'Table to search', required: true },
        { name: 'searchColumn', type: 'string', description: 'Column to search', required: true },
        { name: 'searchTerm', type: 'string', description: 'Search pattern (supports % wildcards)', required: true },
        { name: 'limit', type: 'number', description: 'Max results', required: false, default: 20 },
        { name: 'columns', type: 'string', description: 'Columns to return', required: false, default: '*' },
      ],
      returns: { type: 'object', description: 'DatabaseQueryResult with matched records' },
    },
    {
      name: 'count',
      description: 'Count records in a table with optional filters',
      parameters: [
        { name: 'table', type: 'string', description: 'Table name', required: true },
        { name: 'filters', type: 'array', description: 'Filter conditions', required: false },
      ],
      returns: { type: 'number', description: 'Record count' },
    },
  ];

  readonly permissions = [
    { action: 'query', level: 'read', requiresApproval: false, auditLog: true },
    { action: 'schema', level: 'read', requiresApproval: false, auditLog: false },
    { action: 'search', level: 'read', requiresApproval: false, auditLog: true },
    { action: 'count', level: 'read', requiresApproval: false, auditLog: false },
  ];

  private supabase: SupabaseClient | null = null;
  private schemaCache: DatabaseSchemaResult | null = null;
  private schemaCacheTime = 0;
  private readonly SCHEMA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    supabase: SupabaseClient,
    eventBus?: import('./asis-cse-event-system').CognitiveEventBus,
    metricsEngine?: import('./asis-cse-metrics-engine').MetricsEngine
  ) {
    super(eventBus, metricsEngine);
    this.supabase = supabase;
  }

  isAvailable(): boolean {
    return this.supabase !== null;
  }

  async doExecute(request: ToolExecutionRequest): Promise<any> {
    if (!this.supabase) {
      throw new Error('DatabaseTool not initialized with Supabase client');
    }

    switch (request.capability) {
      case 'query':
        return this.executeQuery(request.parameters as DatabaseQueryOptions);
      case 'schema':
        return this.getSchema(request.parameters.table);
      case 'search':
        return this.searchRecords(request.parameters as DatabaseSearchOptions);
      case 'count':
        return this.countRecords(request.parameters.table, request.parameters.filters);
      default:
        throw new Error(`Unknown capability: ${request.capability}`);
    }
  }

  private async executeQuery(options: DatabaseQueryOptions): Promise<DatabaseQueryResult> {
    const startTime = Date.now();
    let query: any = this.supabase!.from(options.table);

    // Operation
    switch (options.operation) {
      case 'select':
        query = query.select(options.columns || '*', { count: 'exact' });
        break;
      case 'insert':
        query = query.insert(options.values);
        break;
      case 'update':
        query = query.update(options.values);
        break;
      case 'delete':
        query = query.delete();
        break;
      case 'upsert':
        query = query.upsert(options.values);
        break;
      default:
        throw new Error(`Unsupported operation: ${options.operation}`);
    }

    // Apply filters (only for select/update/delete)
    if (options.operation !== 'insert' && options.filters) {
      for (const filter of options.filters) {
        query = this.applyFilter(query, filter.column, filter.operator, filter.value);
      }
    }

    // Order
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
    }

    // Limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Offset / Range
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    // Single row
    if (options.single && options.operation === 'select') {
      query = query.maybeSingle();
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return {
      data,
      count: count ?? (Array.isArray(data) ? data.length : undefined),
      query: `${options.operation} ${options.table}`,
      executionTimeMs: Date.now() - startTime,
    };
  }

  private applyFilter(query: any, column: string, operator: string, value: any): any {
    switch (operator) {
      case 'eq': return query.eq(column, value);
      case 'neq': return query.neq(column, value);
      case 'gt': return query.gt(column, value);
      case 'gte': return query.gte(column, value);
      case 'lt': return query.lt(column, value);
      case 'lte': return query.lte(column, value);
      case 'like': return query.like(column, value);
      case 'ilike': return query.ilike(column, value);
      case 'in': return query.in(column, Array.isArray(value) ? value : [value]);
      case 'is': return query.is(column, value);
      default: throw new Error(`Unknown filter operator: ${operator}`);
    }
  }

  private async getSchema(specificTable?: string): Promise<DatabaseSchemaResult> {
    // Check cache
    if (
      this.schemaCache &&
      Date.now() - this.schemaCacheTime < this.SCHEMA_CACHE_TTL &&
      !specificTable
    ) {
      return this.schemaCache;
    }

    const startTime = Date.now();

    // Query information_schema for table metadata
    const { data, error } = await this.supabase!.rpc('asis_get_schema', {
      p_table: specificTable || null,
    });

    if (error) {
      // Fallback: try to infer from known tables
      return this.fallbackSchema(specificTable);
    }

    const result: DatabaseSchemaResult = {
      tables: data || [],
      totalTables: (data || []).length,
    };

    if (!specificTable) {
      this.schemaCache = result;
      this.schemaCacheTime = Date.now();
    }

    return result;
  }

  private fallbackSchema(specificTable?: string): DatabaseSchemaResult {
    // When RPC is unavailable, return minimal schema info
    return {
      tables: specificTable
        ? [{ name: specificTable, columns: [] }]
        : [],
      totalTables: specificTable ? 1 : 0,
    };
  }

  private async searchRecords(options: DatabaseSearchOptions): Promise<DatabaseQueryResult> {
    return this.executeQuery({
      table: options.table,
      operation: 'select',
      columns: options.columns || '*',
      filters: [
        { column: options.searchColumn, operator: 'ilike', value: `%${options.searchTerm}%` },
      ],
      limit: options.limit || 20,
    });
  }

  private async countRecords(table: string, filters?: any[]): Promise<number> {
    const result = await this.executeQuery({
      table,
      operation: 'select',
      columns: '*',
      filters,
      limit: 1,
    });
    return result.count || 0;
  }

  clearSchemaCache(): void {
    this.schemaCache = null;
    this.schemaCacheTime = 0;
  }
}
