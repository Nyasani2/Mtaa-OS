"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Landmark, FileText, Receipt, TrendingUp, DollarSign, BarChart3, ChevronLeft, LandmarkIcon } from "lucide-react-native";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/domains/civic/treasury", label: "Dashboard", icon: LayoutDashboard },
  { href: "/domains/civic/treasury/accounts", label: "Accounts", icon: Landmark },
  { href: "/domains/civic/treasury/budgets", label: "Budgets", icon: FileText },
  { href: "/domains/civic/treasury/expenditures", label: "Expenditures", icon: Receipt },
  { href: "/domains/civic/treasury/warrants", label: "Warrants", icon: TrendingUp },
  { href: "/domains/civic/treasury/revenue", label: "Revenue", icon: DollarSign },
  { href: "/domains/civic/treasury/reports", label: "Reports", icon: BarChart3 },
];

export function TreasurySidebar() {
  const pathname = usePathname();
  const [config, setConfig] = useState<any>(null);
  const countryCode = typeof window !== "undefined" ? localStorage.getItem("mtaa_country_code") || "KE" : "KE";

  useEffect(() => {
    import("@/lib/supabase/client").then(({ supabase }) => {
      supabase.from("treasury_country_config").select("treasury_name, treasury_short").eq("country_code", countryCode).single().then(({ data }) => setConfig(data));
    });
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <Link href="/domains/civic/treasury" className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-lg"><LandmarkIcon className="w-5 h-5 text-amber-600" /></div>
          <div>
            <h2 className="font-bold text-slate-900">{config?.treasury_short || "Treasury"}</h2>
            <p className="text-xs text-slate-500">{config?.treasury_name || "National Treasury"}</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <Button variant={isActive ? "secondary" : "ghost"} style={cn("w-full justify-start gap-3", isActive && "bg-slate-100 text-slate-900")}>
                <item.icon style={cn("w-4 h-4", isActive ? "text-slate-900" : "text-slate-500")} />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-200">
        <Link href="/domains/civic">
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500">
            <ChevronLeft className="w-4 h-4" />
            Back to Civic
          </Button>
        </Link>
      </div>
    </aside>
  );
}
