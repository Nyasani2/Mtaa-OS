"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Calendar, Pill, FileText,
  Building2, TrendingUp, Heart, ChevronLeft
} from "lucide-react-native";

const navItems = [
  { href: "/domains/civic/health", label: "Dashboard", icon: LayoutDashboard },
  { href: "/domains/civic/health/patients", label: "Patients", icon: Users },
  { href: "/domains/civic/health/appointments", label: "Appointments", icon: Calendar },
  { href: "/domains/civic/health/prescriptions", label: "Prescriptions", icon: Pill },
  { href: "/domains/civic/health/records", label: "Health Records", icon: FileText },
  { href: "/domains/civic/health/facilities", label: "Facilities", icon: Building2 },
  { href: "/domains/civic/health/reports", label: "Reports", icon: TrendingUp },
];

export function HealthSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <Link href="/domains/civic/health" className="flex items-center gap-2">
          <div className="p-2 bg-red-50 rounded-lg"><Heart className="w-5 h-5 text-red-600" /></div>
          <div>
            <h2 className="font-bold text-slate-900">Civic Health</h2>
            <p className="text-xs text-slate-500">Medical Services</p>
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
