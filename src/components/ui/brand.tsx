import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="font-logo tracking-tight leading-none text-2xl sm:text-3xl">
        <span className="text-foreground">LIGHTS</span>
        <span className="text-primary">OUT</span>
      </span>
    </div>
  );
}
