"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { RealtimeClock } from "@/components/ui/realtime-clock";
import {
  BarChart3,
  Map,
  MessageSquare,
  PieChart,
  TrendingUp,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    description: "Executive overview & KPIs",
  },
  {
    name: "EDA",
    href: "/eda",
    icon: PieChart,
    description: "Data exploration & analysis",
  },
  {
    name: "Prediction",
    href: "/prediction",
    icon: TrendingUp,
    description: "Portfolio & route viewer",
  },
  {
    name: "Chat",
    href: "/chat",
    icon: MessageSquare,
    description: "AI assistant & insights",
  },
  {
    name: "Reporting",
    href: "/reporting",
    icon: Map,
    description: "Scheduling & routing",
  },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Left side: Logo + Brand */}
        <div className="flex items-center space-x-3">
          <Logo size="md" />
          <div className="flex flex-col">
            <span className="hidden font-bold text-lg sm:inline-block">
              Cleanon Analytics
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline-block">
              Grease Trap Intelligence Platform
            </span>
          </div>
        </div>
        
        {/* Center: Navigation */}
        <nav className="flex items-center space-x-1 text-sm font-medium">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105",
                  isActive
                    ? "bg-gradient-to-r from-blue-500/10 to-green-500/10 text-foreground border border-blue-200/50 shadow-sm"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline-block">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side: Clock/Date (NO settings, NO version) */}
        <div className="flex items-center">
          <RealtimeClock />
        </div>
      </div>
    </header>
  );
}
