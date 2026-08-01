import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "max-w-prose",
  md: "max-w-2xl",
  lg: "max-w-5xl",
  full: "max-w-7xl",
} as const;

export function Container({
  size = "md",
  className,
  children,
}: {
  size?: keyof typeof sizeMap;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full px-5", sizeMap[size], className)}>
      {children}
    </div>
  );
}
