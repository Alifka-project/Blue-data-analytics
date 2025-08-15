"use client";

import { Header } from "./header";
import { Footer } from "./footer";
import { Toaster } from "@/components/ui/sonner";

interface MainLayoutProps {
  children: React.ReactNode;
  period?: string;
  run_id?: string;
  model_version?: string;
}

export function MainLayout({ 
  children, 
  period, 
  run_id, 
  model_version 
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer 
        period={period}
        run_id={run_id}
        model_version={model_version}
      />
      <Toaster />
    </div>
  );
}


