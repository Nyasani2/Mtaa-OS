"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User, Globe } from "lucide-react-native";

export function RevenueHeader() {
  const [userName, setUserName] = useState<string>("");
  const [notifications, setNotifications] = useState(0);
  const [config, setConfig] = useState<any>(null);
  const countryCode = typeof window !== "undefined" ? localStorage.getItem("mtaa_country_code") || "KE" : "KE";

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.email?.split("@")[0] || "User");
        const { count } = await supabase.from("revenue_returns").select("*", { count: "exact", head: true }).eq("country_code", countryCode).eq("filing_status", "filed").eq("payment_status", "unpaid");
        setNotifications(count || 0);
      }
      const { data: cfg } = await supabase.from("revenue_country_config").select("*").eq("country_code", countryCode).single();
      setConfig(cfg);
    }
    load();
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-900">{config?.authority_name || "Revenue Authority"}</h2>
        <Badge variant="outline" className="flex items-center gap-1"><Globe className="w-3 h-3" />{config?.country_name || countryCode}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5 text-slate-600" />
          {notifications > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">{notifications}</Badge>}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><User className="w-4 h-4 text-slate-600" /></div>
          <span className="text-sm font-medium text-slate-700">{userName}</span>
        </div>
      </div>
    </header>
  );
}
