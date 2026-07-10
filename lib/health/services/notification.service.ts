import { supabase } from "@/lib/supabase/client";
import type { HealthNotification } from "../types";
export class NotificationService {
  static async getNotifications(userId: string): Promise<HealthNotification[]> {
    const { data, error } = await supabase.from("app_notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) throw error; return data || [];
  }
  static subscribeToNotifications(userId: string, callback: () => void): any {
    return supabase.channel(`health-notifications-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "app_notifications", filter: `user_id=eq.${userId}` }, callback)
      .subscribe();
  }
  static async markAsRead(notificationId: string): Promise<void> {
    await supabase.from("app_notifications").update({ is_read: true }).eq("id", notificationId);
  }
}