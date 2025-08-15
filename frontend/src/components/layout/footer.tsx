"use client";

import { Badge } from "@/components/ui/badge";

interface FooterProps {
  period?: string;
  run_id?: string;
  model_version?: string;
}

export function Footer({ period, run_id, model_version }: FooterProps) {
  return (
    <footer className="border-t bg-gradient-to-r from-background via-background/95 to-background mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-4">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-6">
          {/* Left side - Company info */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional Inspection Scheduling Dashboard for{" "}
              <span className="font-semibold text-foreground">Cleanon Grease Trap Recycling Facility</span>
            </p>
            <p className="text-xs text-muted-foreground">© 2024 Cleanon Analytics. All rights reserved.</p>
          </div>
          
          {/* Right side - Metadata badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-x-4 gap-y-2 w-full md:w-auto">
            {period && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Period:</span>
                <Badge variant="outline" className="text-xs">{period}</Badge>
              </div>
            )}
            
            {run_id && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Run ID:</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {run_id.slice(0, 8)}...
                </Badge>
              </div>
            )}
            
            {model_version && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Model:</span>
                <Badge variant="outline" className="text-xs">{model_version}</Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}