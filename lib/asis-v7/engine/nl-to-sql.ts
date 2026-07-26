/**
 * ASIS v7 - Natural Language to SQL Converter
 * Converts user natural language queries into Supabase SQL queries
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SQLQueryResult {
  sql: string;
  params?: Record<string, any>;
  explanation: string;
  table?: string;
  operation?: 'select' | 'insert' | 'update' | 'delete' | 'count' | 'aggregate';
}

export interface NLToSQLOptions {
  userId?: string;
  schema?: string;
  maxResults?: number;
}

export interface QueryPattern {
  pattern: RegExp;
  handler: (match: RegExpMatchArray, options: NLToSQLOptions) => SQLQueryResult;
  description: string;
}

// ============================================================================
// QUERY PATTERNS
// ============================================================================

const QUERY_PATTERNS: QueryPattern[] = [
  // --- COUNT PATTERNS ---
  {
    pattern: /how many (\w+) (?:do I have|are there|exist)/i,
    handler: (m, opts) => ({
      sql: `SELECT COUNT(*) FROM ${m[1]} WHERE user_id = '${opts.userId || "''"}'`,
      explanation: `Count total ${m[1]}`,
      table: m[1],
      operation: 'count',
    }),
    description: 'Count items',
  },
  {
    pattern: /count (?:all )?(\w+)/i,
    handler: (m, opts) => ({
      sql: `SELECT COUNT(*) FROM ${m[1]}`,
      explanation: `Count all ${m[1]}`,
      table: m[1],
      operation: 'count',
    }),
    description: 'Count all records',
  },

  // --- LIST / SELECT PATTERNS ---
  {
    pattern: /(?:show|list|get|find) (?:all )?(?:my )?(\w+)(?:\s+where\s+(.+))?/i,
    handler: (m, opts) => {
      const table = m[1];
      const whereClause = m[2];
      let sql = `SELECT * FROM ${table}`;
      let explanation = `List all ${table}`;

      if (whereClause) {
        const conditions = parseWhereClause(whereClause);
        if (conditions) {
          sql += ` WHERE ${conditions}`;
          explanation += ` where ${whereClause}`;
        }
      }

      if (opts.userId) {
        sql += whereClause ? ` AND user_id = '${opts.userId}'` : ` WHERE user_id = '${opts.userId}'`;
      }

      sql += ' ORDER BY created_at DESC';
      const limitMatch = whereClause?.match(/limit\s+(\d+)/i);
      const limit = limitMatch ? parseInt(limitMatch[1], 10) : (opts.maxResults || 50);
      sql += ` LIMIT ${limit}`;

      return { sql, explanation, table, operation: 'select' };
    },
    description: 'List records',
  },

  // --- RECENT PATTERNS ---
  {
    pattern: /(?:show|get|list) (?:the )?last (\d+) (\w+)/i,
    handler: (m, opts) => {
      const count = parseInt(m[1], 10) || 10;
      const table = m[2];
      let sql = `SELECT * FROM ${table}`;
      if (opts.userId) {
        sql += ` WHERE user_id = '${opts.userId}'`;
      }
      sql += ` ORDER BY created_at DESC LIMIT ${count}`;
      return {
        sql,
        explanation: `Last ${count} ${table}`,
        table,
        operation: 'select',
      };
    },
    description: 'Last N records',
  },

  // --- SEARCH PATTERNS ---
  {
    pattern: /(?:search|find) (\w+) (?:with|containing|like) ['"]?(.+?)['"]?$/i,
    handler: (m, opts) => {
      const table = m[1];
      const searchTerm = m[2];
      return {
        sql: `SELECT * FROM ${table} WHERE name ILIKE '%${searchTerm}%' OR description ILIKE '%${searchTerm}%'`,
        explanation: `Search ${table} for "${searchTerm}"`,
        table,
        operation: 'select',
      };
    },
    description: 'Search by term',
  },

  // --- WALLET / TRANSACTION PATTERNS ---
  {
    pattern: /(?:show|get|list) (?:my )?(?:wallet )?transactions/i,
    handler: (m, opts) => ({
      sql: `SELECT * FROM wallet_transactions WHERE user_id = '${opts.userId || "''"}' ORDER BY created_at DESC LIMIT 50`,
      explanation: 'List wallet transactions',
      table: 'wallet_transactions',
      operation: 'select',
    }),
    description: 'Wallet transactions',
  },
  {
    pattern: /(?:show|get) (?:my )?balance/i,
    handler: (m, opts) => ({
      sql: `SELECT balance, currency FROM wallet_accounts WHERE user_id = '${opts.userId || "''"}' AND is_default = true LIMIT 1`,
      explanation: 'Show wallet balance',
      table: 'wallet_accounts',
      operation: 'select',
    }),
    description: 'Wallet balance',
  },
  {
    pattern: /(?:show|get) (?:my )?last (\d+) transactions/i,
    handler: (m, opts) => {
      const count = parseInt(m[1], 10) || 10;
      return {
        sql: `SELECT * FROM wallet_transactions WHERE user_id = '${opts.userId || "''"}' ORDER BY created_at DESC LIMIT ${count}`,
        explanation: `Last ${count} transactions`,
        table: 'wallet_transactions',
        operation: 'select',
      };
    },
    description: 'Last N transactions',
  },

  // --- PROFILE PATTERNS ---
  {
    pattern: /(?:show|get) (?:my )?profile/i,
    handler: (m, opts) => ({
      sql: `SELECT * FROM user_profiles WHERE id = '${opts.userId || "''"}' LIMIT 1`,
      explanation: 'Show user profile',
      table: 'user_profiles',
      operation: 'select',
    }),
    description: 'User profile',
  },

  // --- NOTIFICATION PATTERNS ---
  {
    pattern: /(?:show|get|list) (?:my )?notifications/i,
    handler: (m, opts) => ({
      sql: `SELECT * FROM notifications WHERE user_id = '${opts.userId || "''"}' ORDER BY created_at DESC LIMIT 20`,
      explanation: 'List notifications',
      table: 'notifications',
      operation: 'select',
    }),
    description: 'Notifications',
  },

  // --- HEALTH PATTERNS ---
  {
    pattern: /(?:show|get) (?:my )?health records/i,
    handler: (m, opts) => ({
      sql: `SELECT * FROM health_records WHERE user_id = '${opts.userId || "''"}' ORDER BY created_at DESC LIMIT 20`,
      explanation: 'List health records',
      table: 'health_records',
      operation: 'select',
    }),
    description: 'Health records',
  },

  // --- ORDER PATTERNS ---
  {
    pattern: /(?:show|get|list) (?:my )?orders/i,
    handler: (m, opts) => ({
      sql: `SELECT * FROM shop_orders WHERE user_id = '${opts.userId || "''"}' ORDER BY created_at DESC LIMIT 20`,
      explanation: 'List orders',
      table: 'shop_orders',
      operation: 'select',
    }),
    description: 'Orders',
  },

  // --- SUMMARY / AGGREGATE PATTERNS ---
  {
    pattern: /(?:what is|get) (?:the )?total (\w+) (?:for|of) (\w+)/i,
    handler: (m, opts) => {
      const column = m[1];
      const table = m[2];
      return {
        sql: `SELECT SUM(${column}) as total FROM ${table} WHERE user_id = '${opts.userId || "''"}'`,
        explanation: `Total ${column} for ${table}`,
        table,
        operation: 'aggregate',
      };
    },
    description: 'Aggregate total',
  },

  // --- FALLBACK: RAW TABLE QUERY ---
  {
    pattern: /^(\w+)$/i,
    handler: (m, opts) => ({
      sql: `SELECT * FROM ${m[1]} LIMIT ${opts.maxResults || 50}`,
      explanation: `List ${m[1]}`,
      table: m[1],
      operation: 'select',
    }),
    description: 'Raw table name',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseWhereClause(clause: string): string | null {
  // Simple where clause parser
  // e.g., "status = pending" -> "status = 'pending'"
  // e.g., "age > 18" -> "age > 18"
  // e.g., "name is John" -> "name = 'John'"

  const operators: [RegExp, string][] = [
    [/(?:^|\s)is\s+(.+)/i, '='],
    [/(?:^|\s)equals?\s+(.+)/i, '='],
    [/(?:^|\s)greater than\s+(.+)/i, '>'],
    [/(?:^|\s)more than\s+(.+)/i, '>'],
    [/(?:^|\s)less than\s+(.+)/i, '<'],
    [/(?:^|\s)fewer than\s+(.+)/i, '<'],
    [/(?:^|\s)greater than or equal to\s+(.+)/i, '>='],
    [/(?:^|\s)less than or equal to\s+(.+)/i, '<='],
    [/(?:^|\s)contains\s+(.+)/i, 'ILIKE'],
    [/(?:^|\s)like\s+(.+)/i, 'ILIKE'],
    [/(?:^|\s)starts? with\s+(.+)/i, 'ILIKE'],
    [/(?:^|\s)ends? with\s+(.+)/i, 'ILIKE'],
  ];

  for (const [regex, op] of operators) {
    const matchResult = clause.match(regex);
    if (matchResult) {
      const value = matchResult[1].trim();
      const isNumeric = !isNaN(Number(value));
      const formattedValue = isNumeric ? value : `'${value}'`;

      // Extract column name (everything before the operator phrase)
      const columnMatch = clause.match(/^(\w+)/);
      const column = columnMatch ? columnMatch[1] : 'id';

      if (op === 'ILIKE') {
        if (regex.source.includes('starts')) {
          return `${column} ILIKE '${value}%'`;
        }
        if (regex.source.includes('ends')) {
          return `${column} ILIKE '%${value}'`;
        }
        return `${column} ILIKE '%${value}%'`;
      }

      return `${column} ${op} ${formattedValue}`;
    }
  }

  // Try simple "column operator value" format
  const simpleMatch = clause.match(/^(\w+)\s*(=|!=|<>|>|<|>=|<=)\s*(.+)$/);
  if (simpleMatch) {
    const column = simpleMatch[1];
    const op = simpleMatch[2];
    const value = simpleMatch[3].trim();
    const isNumeric = !isNaN(Number(value));
    return `${column} ${op} ${isNumeric ? value : `'${value}'`}`;
  }

  return null;
}

function sanitizeTableName(name: string): string {
  // Remove any non-alphanumeric/underscore characters
  return name.replace(/[^a-zA-Z0-9_]/g, '');
}

function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '');
}

// ============================================================================
// MAIN CLASS
// ============================================================================

export class NLToSQLConverter {
  private patterns: QueryPattern[];
  private options: NLToSQLOptions;

  constructor(options: NLToSQLOptions = {}) {
    this.patterns = [...QUERY_PATTERNS];
    this.options = {
      maxResults: 50,
      ...options,
    };
  }

  /**
   * Convert natural language to SQL query
   */
  convert(query: string): SQLQueryResult {
    const sanitizedQuery = query.trim();

    if (!sanitizedQuery) {
      return {
        sql: 'SELECT 1',
        explanation: 'Empty query - returning dummy result',
        operation: 'select',
      };
    }

    // Try each pattern
    for (const pattern of this.patterns) {
      const matchResult = sanitizedQuery.match(pattern.pattern);
      if (matchResult) {
        try {
          return pattern.handler(matchResult, this.options);
        } catch (err) {
          console.error(`Pattern handler error for "${pattern.description}":`, err);
          continue;
        }
      }
    }

    // Fallback: try to extract table name and do a simple SELECT
    const words = sanitizedQuery.split(/\s+/);
    const potentialTable = words.find((w) => w.length > 2 && !['the', 'my', 'all', 'show', 'get', 'list', 'find', 'search', 'for', 'from', 'where', 'and', 'with'].includes(w.toLowerCase()));

    if (potentialTable) {
      const table = sanitizeTableName(potentialTable);
      return {
        sql: `SELECT * FROM ${table} LIMIT ${this.options.maxResults || 50}`,
        explanation: `Fallback query on table "${table}"`,
        table,
        operation: 'select',
      };
    }

    // Ultimate fallback
    return {
      sql: `SELECT '${sanitizedQuery.replace(/'/g, "''")}' as query`,
      explanation: 'Could not parse query - returning as literal',
      operation: 'select',
    };
  }

  /**
   * Execute the converted SQL query
   */
  async execute(query: string): Promise<{ data: any[] | null; error: any; explanation: string }> {
    const result = this.convert(query);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: result.sql });

      if (error) {
        // Fallback: try direct table query if RPC fails
        if (result.table) {
          const { data: directData, error: directError } = await supabase
            .from(result.table)
            .select('*')
            .limit(this.options.maxResults || 50);

          if (!directError) {
            return { data: directData, error: null, explanation: result.explanation };
          }
        }

        return { data: null, error, explanation: result.explanation };
      }

      return { data, error: null, explanation: result.explanation };
    } catch (err) {
      return { data: null, error: err, explanation: result.explanation };
    }
  }

  /**
   * Add a custom pattern
   */
  addPattern(pattern: QueryPattern): void {
    this.patterns.unshift(pattern);
  }

  /**
   * Get all available patterns
   */
  getPatterns(): { description: string; example: string }[] {
    return this.patterns.map((p) => ({
      description: p.description,
      example: p.pattern.toString(),
    }));
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let nlToSQLInstance: NLToSQLConverter | null = null;

export function getNLToSQLConverter(options?: NLToSQLOptions): NLToSQLConverter {
  if (!nlToSQLInstance) {
    nlToSQLInstance = new NLToSQLConverter(options);
  }
  return nlToSQLInstance;
}

/**
 * Quick convert function
 */
export function quickConvertToSQL(query: string, options?: NLToSQLOptions): SQLQueryResult {
  const converter = new NLToSQLConverter(options);
  return converter.convert(query);
}

export default NLToSQLConverter;