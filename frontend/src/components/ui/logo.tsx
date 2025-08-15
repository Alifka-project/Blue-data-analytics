"use client";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={`${sizeClasses[size]} relative ${className}`}>
      {/* Oil drop background */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 shadow-md">
        {/* Grease texture overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-amber-700/20 to-transparent" />
      </div>
      
      {/* Data wave pattern */}
      <div className="absolute inset-1 flex items-center justify-center">
        <div className="relative">
          {/* Chart bars representing data */}
          <div className="flex items-end space-x-0.5">
            <div className="w-0.5 h-2 bg-white/90 rounded-t-sm" />
            <div className="w-0.5 h-3 bg-white/80 rounded-t-sm" />
            <div className="w-0.5 h-1.5 bg-white/70 rounded-t-sm" />
            <div className="w-0.5 h-3.5 bg-white/90 rounded-t-sm" />
            <div className="w-0.5 h-2.5 bg-white/80 rounded-t-sm" />
          </div>
        </div>
      </div>
      
      {/* Subtle highlight */}
      <div className="absolute top-1 left-1 h-1.5 w-1.5 rounded-full bg-white/40" />
    </div>
  );
}
