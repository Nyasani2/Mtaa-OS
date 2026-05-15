"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User } from "lucide-react-native";
import Link from "next/link";

export function HealthHeader() {
  const [userName, setUserName] = useState<string>("");
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email?.split("@")[0] || "User");
        const { count } = await supabase.from("health_records").select("*", { count: "exact", head: true }).eq("review_status", "pending");
        setNotifications(count || 0);
      }
    }
    loadUser();
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Health Management System</h2>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5 text-slate-600" />
          {notifications > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">{notifications}</Badge>
          )}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-sm font-medium text-slate-700">{userName}</span>
        </div>
      </div>
    </header>
  );
}
