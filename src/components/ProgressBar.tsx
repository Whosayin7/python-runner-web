import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  label?: string;
  variant?: "encrypt" | "decrypt";
}

export function ProgressBar({ progress, label, variant = "encrypt" }: ProgressBarProps) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className={cn(
            "font-mono font-semibold",
            variant === "encrypt" ? "text-primary" : "text-secondary"
          )}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variant === "encrypt" 
              ? "bg-gradient-to-r from-primary to-primary/70 shadow-[0_0_10px_hsl(160_100%_50%/0.5)]" 
              : "bg-gradient-to-r from-secondary to-secondary/70 shadow-[0_0_10px_hsl(200_100%_50%/0.5)]"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
