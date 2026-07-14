import { supabase } from '@/lib/supabase';

export interface DBQueryResult {
  data: any[] | null;
  error: string | null;
  count?: number;
}

export interface TableInfo {
  name: string;
  rowCount: number;
  columns: string[];
}

export class DatabaseTool {
  async query(sql: string): Promise<DBQueryResult> {
    try {
      // Use Supabase RPC for raw SQL (requires exec_sql function)
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });

      if (error) {
        // Fallback: try to parse as simple SELECT and use table API
        return await this.fallbackQuery(sql);
      }

      return { data, error: null, count: data?.length };
    } catch (e: any) {
      return { data: null, error: e.message || 'Database query failed' };
    }
  }

  async listTables(): Promise<TableInfo[]> {
    try {
      // Query information_schema for table list
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .neq('table_name', 'pg_stat_statements');

      if (error) {
        // Fallback: try common MTAA tables
        return this.getKnownTables();
      }

      const tables: TableInfo[] = [];
      for (const row of data || []) {
        const name = row.table_name;
        // Try to get count
        const { count } = await supabase.from(name).select('*', { count: 'exact', head: true });
        tables.push({ name, rowCount: count || 0, columns: [] });
      }

      return tables;
    } catch (e) {
      return this.getKnownTables();
    }
  }

  async describeTable(tableName: string): Promise<{ columns: string[]; sample: any[] }> {
    try {
      // Get sample data to infer columns
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error || !data || data.length === 0) {
        return { columns: [], sample: [] };
      }

      const columns = Object.keys(data[0]);
      return { columns, sample: data };
    } catch (e) {
      return { columns: [], sample: [] };
    }
  }

  private async fallbackQuery(sql: string): Promise<DBQueryResult> {
    // Simple SELECT * FROM table_name parser
    const match = sql.match(/SELECT\s+\*\s+FROM\s+(\w+)/i);
    if (match) {
      const table = match[1];
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(50);

      return { data, error: error?.message || null, count: count || undefined };
    }

    return { data: null, error: 'Complex queries require exec_sql edge function' };
  }

  private getKnownTables(): TableInfo[] {
    // Known MTAA tables based on schema
    const known = [
      'user_profiles', 'wallet_transactions', 'education_courses',
      'health_patients', 'mtaxi_rides', 'mtruck_trucks',
      'streets_posts', 'shop_items', 'tribes_groups',
      'civic_cases', 'police_incidents', 'restaurant_orders',
      'jobs_listings', 'pulse_readings', 'studio_projects',
      'treasury_accounts', 'notifications', 'messages'
    ];

    return known.map(name => ({ name, rowCount: 0, columns: [] }));
  }
}

export const databaseTool = new DatabaseTool();
