import { supabase } from '@/lib/supabase';

export interface TableInfo {
  name: string;
  rowCount: number;
}

export class DatabaseTool {
  async listTables(): Promise<TableInfo[]> {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (error) return this.getFallbackTables();

      return (data || []).map(row => ({
        name: row.table_name,
        rowCount: 0
      }));
    } catch (e) {
      return this.getFallbackTables();
    }
  }

  private getFallbackTables(): TableInfo[] {
    return [
      { name: 'user_profiles', rowCount: 0 },
      { name: 'wallet_transactions', rowCount: 0 },
      { name: 'education_courses', rowCount: 0 },
      { name: 'health_patients', rowCount: 0 },
      { name: 'mtaxi_rides', rowCount: 0 },
      { name: 'streets_posts', rowCount: 0 },
      { name: 'shop_items', rowCount: 0 },
      { name: 'notifications', rowCount: 0 },
    ];
  }
}

export const databaseTool = new DatabaseTool();
