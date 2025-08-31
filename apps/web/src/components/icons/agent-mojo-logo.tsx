import { cn } from "@/lib/utils";

export function AgentMojoLogo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes: Record<typeof size, string> = {
    sm: "text-xs",
    md: "text-2xl",
    lg: "text-4xl md:text-6xl",
  } as const;

  return (
    <div
      className={cn(
        "font-arcade arcade-title select-none",
        sizes[size],
        className,
      )}
    >
      AGENT MOJO
    </div>
  );
}

export function InsertCoin({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "font-arcade arcade-coin text-[10px] select-none md:text-xs",
        className,
      )}
    >
      INSERT COIN ▸ 1
    </div>
  );
}
